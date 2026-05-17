const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createResponse, createError } = require('utils');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME || 'CoffeeShopInventory';

exports.lambdaHandler = async (event, context) => {
    try {
        if (!event.body) {
            return createError(400, "Missing request body");
        }
        
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return createError(400, "Invalid JSON format");
        }
        
        const requiredFields = ['name', 'category', 'quantity'];
        for (const field of requiredFields) {
            if (body[field] === undefined) {
                return createError(400, `Missing required field: ${field}`);
            }
        }
        
        const item = {
            itemId: body.itemId || crypto.randomUUID(),
            name: body.name,
            category: body.category,
            quantity: parseInt(body.quantity),
            reorderLevel: parseInt(body.reorderLevel || 10),
            unit: body.unit || 'units'
        };
        
        const command = new PutCommand({
            TableName: tableName,
            Item: item
        });
        
        await docClient.send(command);
        
        return createResponse(201, {
            message: 'Inventory item created successfully',
            item: item
        });

    } catch (err) {
        console.error("Error", err);
        return createError(500, "Internal server error");
    }
};
