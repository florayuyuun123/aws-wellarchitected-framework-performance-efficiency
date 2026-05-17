const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { createResponse, createError } = require('utils');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME || 'CoffeeShopInventory';

exports.lambdaHandler = async (event, context) => {
    try {
        const pathParameters = event.pathParameters || {};
        
        if (pathParameters.itemId) {
            const itemId = pathParameters.itemId;
            const command = new GetCommand({
                TableName: tableName,
                Key: { itemId: itemId }
            });
            const response = await docClient.send(command);
            
            if (response.Item) {
                return createResponse(200, response.Item);
            } else {
                return createError(404, `Inventory item ${itemId} not found`);
            }
        } else {
            // Scan all items
            const command = new ScanCommand({
                TableName: tableName
            });
            const response = await docClient.send(command);
            return createResponse(200, { items: response.Items || [] });
        }
    } catch (err) {
        console.error("Error", err);
        return createError(500, "Internal server error connecting to the database");
    }
};
