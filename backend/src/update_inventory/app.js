const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { createResponse, createError } = require('utils');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME || 'CoffeeShopInventory';

exports.lambdaHandler = async (event, context) => {
    try {
        const pathParameters = event.pathParameters || {};
        if (!pathParameters.itemId) {
            return createError(400, "Missing itemId in path");
        }
        const itemId = pathParameters.itemId;
        
        if (!event.body) {
            return createError(400, "Missing request body");
        }
        
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return createError(400, "Invalid JSON format");
        }
        
        const updatableFields = ['name', 'category', 'quantity', 'reorderLevel', 'unit'];
        const updates = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        
        for (const field of updatableFields) {
            if (body[field] !== undefined) {
                const attrName = `#${field}`;
                const attrValue = `:${field}`;
                updates.push(`${attrName} = ${attrValue}`);
                expressionAttributeNames[attrName] = field;
                expressionAttributeValues[attrValue] = body[field];
            }
        }
        
        if (updates.length === 0) {
            return createError(400, "No valid fields provided for update");
        }
        
        const updateExpression = "SET " + updates.join(", ");
        
        const command = new UpdateCommand({
            TableName: tableName,
            Key: { itemId: itemId },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });
        
        const response = await docClient.send(command);
        
        return createResponse(200, {
            message: 'Inventory item updated successfully',
            item: response.Attributes || {}
        });

    } catch (err) {
        console.error("Error", err);
        return createError(500, "Failed to update item in database");
    }
};
