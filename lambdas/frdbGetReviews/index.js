const aws = require('aws-sdk');
const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: '',
    region: ''
});
const { makeError, makeStackTraceError } = require('/opt/nodejs/frdbMakeErrorUtil');

exports.handler = async function (event) {
    if (event) {
        const data = await getReviews(event.restaurant_id, event.last_id, event.last_date);
        return data;
    }
}

const getReviews = async function (restaurantId, lastId, lastDate) {
    try {
        const params = {
            ExpressionAttributeNames: {
                '#type': 'type'
            },
            ExpressionAttributeValues: {
                ':restaurant_id': restaurantId
            },
            KeyConditionExpression: 'restaurant_id = :restaurant_id',
            TableName: 'frdb',
            IndexName: 'restaurant_review_index',
            ProjectionExpression: "restaurant_id, create_date, user_id, review_text, id, rating, imgs, #type",
            ScanIndexForward: false,
            Limit: 50
        };
        if (lastId && lastDate) {
            params.ExclusiveStartKey = makeLastEvaluatedKey(restaurantId, lastId, lastDate);
        }
        const data = await ddbClient.query(params).promise();
        return data?.Items ? getSuccessfulResponse(data) : makeError();
    } catch (e) {
        console.error('error in getReviews: ', e);
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

function makeLastEvaluatedKey(restaurantId, lastId, lastDate) {
    const lastEk = {
        'create_date': lastDate,
        'restaurant_id': restaurantId,
        'id': lastId,
        'type': 'review'
    };
    return lastEk;
}

if (process.argv[2] === 'test') {
    const testFunction = async () => {
        const itemData = require(`./reviewJson.json`);
        const data = await getReviews(itemData.restaurant_id, itemData.last_id, itemData.last_date);
        console.log(data);

    }
    testFunction();
}