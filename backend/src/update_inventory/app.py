import os
import json
import boto3
from botocore.exceptions import ClientError
from utils import create_response, create_error

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'CoffeeShopInventory')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        path_parameters = event.get('pathParameters')
        if not path_parameters or 'itemId' not in path_parameters:
            return create_error(400, "Missing itemId in path")
            
        item_id = path_parameters['itemId']
        
        if not event.get('body'):
            return create_error(400, "Missing request body")
            
        body = json.loads(event['body'])
        
        # Build update expression dynamically based on provided fields
        update_expression = "SET "
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        updatable_fields = ['name', 'category', 'quantity', 'reorderLevel', 'unit']
        
        updates = []
        for field in updatable_fields:
            if field in body:
                attr_name = f"#{field}"
                attr_value = f":{field}"
                updates.append(f"{attr_name} = {attr_value}")
                expression_attribute_names[attr_name] = field
                expression_attribute_values[attr_value] = body[field]
                
        if not updates:
            return create_error(400, "No valid fields provided for update")
            
        update_expression += ", ".join(updates)
        
        # UpdateItem in DynamoDB
        response = table.update_item(
            Key={'itemId': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )
        
        return create_response(200, {
            'message': 'Inventory item updated successfully',
            'item': response.get('Attributes', {})
        })

    except json.JSONDecodeError:
        return create_error(400, "Invalid JSON format in request body")
    except ClientError as e:
        print(f"DynamoDB Error: {e}")
        return create_error(500, "Failed to update item in database")
    except Exception as e:
        print(f"Error: {e}")
        return create_error(500, "Internal server error")
