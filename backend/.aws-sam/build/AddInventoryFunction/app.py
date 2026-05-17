import os
import json
import boto3
import uuid
from botocore.exceptions import ClientError
from utils import create_response, create_error

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'CoffeeShopInventory')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        if not event.get('body'):
            return create_error(400, "Missing request body")
            
        body = json.loads(event['body'])
        
        # Validate required fields
        required_fields = ['name', 'category', 'quantity']
        for field in required_fields:
            if field not in body:
                return create_error(400, f"Missing required field: {field}")
                
        # Create a new item
        item_id = body.get('itemId', str(uuid.uuid4()))
        
        item = {
            'itemId': item_id,
            'name': body['name'],
            'category': body['category'],
            'quantity': int(body['quantity']),
            'reorderLevel': int(body.get('reorderLevel', 10)),
            'unit': body.get('unit', 'units')
        }
        
        # PutItem into DynamoDB
        table.put_item(Item=item)
        
        return create_response(201, {
            'message': 'Inventory item created successfully',
            'item': item
        })

    except json.JSONDecodeError:
        return create_error(400, "Invalid JSON format in request body")
    except ClientError as e:
        print(f"DynamoDB Error: {e}")
        return create_error(500, "Failed to save item to database")
    except Exception as e:
        print(f"Error: {e}")
        return create_error(500, "Internal server error")
