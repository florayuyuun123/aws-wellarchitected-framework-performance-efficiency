import os
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
        
        # DeleteItem from DynamoDB
        table.delete_item(Key={'itemId': item_id})
        
        return create_response(200, {
            'message': f'Inventory item {item_id} deleted successfully'
        })

    except ClientError as e:
        print(f"DynamoDB Error: {e}")
        return create_error(500, "Failed to delete item from database")
    except Exception as e:
        print(f"Error: {e}")
        return create_error(500, "Internal server error")
