const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto'); // Built-in Node.js module

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // En integración API Gateway Proxy, el body viene como string JSON
        const body = JSON.parse(event.body);
        
        // El Request Validator del API Gateway (Anti-Inyección) ya filtró campos adicionales y requeridos.
        // Aquí procedemos con la lógica de negocio.
        const transactionId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const params = {
            TableName: process.env.DYNAMODB_TABLE,
            Item: {
                transactionId: transactionId,
                method: body.method,
                amount: body.amount,
                status: 'SUCCESS', // Simulación: siempre aprueba
                timestamp: timestamp,
                bankName: body.bankName || null,
            }
        };

        await docClient.send(new PutCommand(params));

        return {
            statusCode: 200,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: JSON.stringify({ 
                message: 'Su pago fue procesado y aceptado', 
                transactionId: transactionId,
                status: 'SUCCESS'
            })
        };

    } catch (error) {
        console.error('Error processing payment:', error);
        return {
            statusCode: 500,
            headers: { 
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
