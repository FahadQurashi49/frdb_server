const aws = require('aws-sdk');
const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: '',
    region: ''
});
const { makeError, makeStackTraceError } = require('/opt/nodejs/frdbMakeErrorUtil');

exports.handler = async function (event) {
    if (event) {
        const data = await getRestaurants(event.location, event.lastRestaurantId, event.lastRating);
        return data;
    }
}

const getRestaurants = async function (location, lastRestaurantId, lastRating) {
    try {
        const params = {
        ExpressionAttributeNames: {
            '#location': 'location',
            '#type': 'type'
        },
        ExpressionAttributeValues: {
            ':location': location //"#Karachi #Bahadurabad"
        },
        KeyConditionExpression: '#location = :location',
        TableName: 'frdb',
        IndexName: 'restaurant_location_index',
        ProjectionExpression: "#location, avg_rating, restaurant_name, description, logo, id, total_ratings, #type",
        ScanIndexForward: false,
        Limit: 50
    };
    if (lastRestaurantId && lastRating !== undefined) {
        params.ExclusiveStartKey = makeLastEvaluatedKey(location, lastRestaurantId, lastRating);
    }
    const data = await ddbClient.query(params).promise();
    return data?.Items ? getSuccessfulResponse(data) : makeError();
    } catch(e) {
        console.error('error in getRestaurants: ', e);
        return makeStackTraceError(e);
    }
    
}

const getSuccessfulResponse = function (data) {
    return {
        items: data.Items,
        count: data.Count,
        status: 200
    };
}

function makeLastEvaluatedKey(location, lastRestaurantId, lastRating) {
    const lastEk = {
        'avg_rating': lastRating,
        'location': location,
        'id': lastRestaurantId,
        'type': 'restaurant'
    };
    return lastEk;
}

if (process.argv[2] === 'test') {
    const testFunction = async () => {
        const itemData = require(`./restaurantJson.json`);
        const data = await getRestaurants(itemData.location, itemData.lastRestaurantId, itemData.lastRating);
        console.log(data);

    }
    testFunction();
}