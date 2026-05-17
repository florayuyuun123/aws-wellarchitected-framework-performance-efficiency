const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
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
        
        const command = new DeleteCommand({
            TableName: tableName,
            Key: { itemId: itemId }
        });
        
        await docClient.send(command);
        
        return createResponse(200, {
            message: `Inventory item ${itemId} deleted successfully`
        });

    } catch (err) {
        console.error("Error", err);
        return createError(500, "Failed to delete item from database");
    }
};
