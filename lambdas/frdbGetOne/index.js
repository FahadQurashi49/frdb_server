const aws = require('aws-sdk');
const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: '',
    region: ''
});
const { makeError, makeStackTraceError } = require('/opt/nodejs/frdbMakeErrorUtil');

exports.handler = async function (event, context) {
    if (event?.type === 'restaurant') {
        const data = await getRestaurant(event.id, context);
        return data;
    } else if (event?.type === 'review') {
        const data = await getReview(event.id);
        return data;
    }
}

const getRestaurant = async function (restaurantId) {
    try {
        const params = {
            TableName: 'frdb',
            Key: {
                id: restaurantId,
                type: 'restaurant'
            },
            AttributesToGet: [
                'id',
                'type',
                'restaurant_name',
                'description',
                'location',
                'avg_rating',
                'total_ratings',
                'user_id',
                'logo'
            ],
        };
        const data = await ddbClient.get(params).promise();
        return data?.Item ? data.Item : makeError('Restaurant not found', 404);
    } catch (e) {
        console.error('error in getRestaurant: ', e);
        return makeStackTraceError(e);
    }
}

const getReview = async function (reviewId) {
    try {
        const params = {
            TableName: 'frdb',
            Key: {
                id: reviewId,
                type: 'review'
            },
            AttributesToGet: [
                'id',
                'type',
                'review_text',
                'create_date',
                'restaurant_id',
                'user_id',
                'rating',
                'imgs'
            ]
        };
        const data = await ddbClient.get(params).promise();
        return data?.Item ? data.Item : makeError('Review not found', 404);
    } catch (e) {
        console.error('error in getReview: ', e);
        return makeStackTraceError(e);
    }
}

if (process.argv[2] === 'test') {
    const testFunction = async () => {
        if (process.argv[3] === 'restaurant') {
            const restaurantId = process.argv[4];
            const data = await getRestaurant(restaurantId);
            console.log(data);
        } else if (process.argv[3] === 'review') {
            const reviewId = process.argv[4];
            const data = await getReview(reviewId);
            console.log(data);
        }
        
    }
    testFunction();
}