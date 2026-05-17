import os
import boto3
from botocore.exceptions import ClientError
from utils import create_response, create_error

# Initialize the DynamoDB client once per execution environment (Performance Efficiency)
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'CoffeeShopInventory')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        # Check if this is a request for a specific item
        path_parameters = event.get('pathParameters')
        
        if path_parameters and 'itemId' in path_parameters:
            item_id = path_parameters['itemId']
            response = table.get_item(Key={'itemId': item_id})
            
            if 'Item' in response:
                return create_response(200, response['Item'])
            else:
                return create_error(404, f"Inventory item {item_id} not found")
                
        # Otherwise, scan all items (For a real production app with massive data, use Query/GSI)
        else:
            response = table.scan()
            items = response.get('Items', [])
            return create_response(200, {'items': items})

    except ClientError as e:
        print(f"DynamoDB Error: {e}")
        return create_error(500, "Internal server error connecting to the database")
    except Exception as e:
        print(f"Error: {e}")
        return create_error(500, "Internal server error processing the request")
