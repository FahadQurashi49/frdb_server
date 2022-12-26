const aws = require('aws-sdk');
const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: '',
    region: ''
});

const frdbGetLoginUser = require('/opt/nodejs/frdbGetLoginUser');
const UUID4 = require('uuid').v4;
const { makeError, makeStackTraceError } = require('/opt/nodejs/frdbMakeErrorUtil');


exports.handler = async function (event) {
    if (event?.type === 'restaurant') {
        const data = await createRestaurant(event);
        console.log(data);
        return data;
    } else if (event?.type === 'review') {
        const data = await createReview(event);
        console.log(data);
        return data;
    }
}

const createReview = async function (review) {
    try {
        const userData = await frdbGetLoginUser.getLoginUser(review.token);
        if (userData?.status === 200) {
            delete review.token;
            review.create_date = new Date().getTime();
            review.id = UUID4();
            const putParams = {
                TableName: 'frdb',
                Item: review,
            };
            
            const restaurant = await updateRestaurantRating(review.restaurant_id, review.rating);
            if (!restaurant) {
                return makeError('Unable to update restaurant rating', 500);
            }
            const updateParams = {
                TableName: 'frdb',
                Key: {
                    id: restaurant.id,
                    type: 'restaurant'
                },
                UpdateExpression: 'set avg_rating = :avg_rating, total_ratings = :total_ratings',
                ExpressionAttributeValues: {
                  ':avg_rating' : restaurant.avg_rating,
                  ':total_ratings' : restaurant.total_ratings
                }
            };

            const transactParams = {
                TransactItems: [{
                    Put: putParams
                }, {
                    Update: updateParams
                }]
            };
            const data = await ddbClient.transactWrite(transactParams).promise();
            if (data) {
                return {
                    msg: 'review added successfully',
                    reviewId: review.id,
                    status: 200
                };
            } else {
                return makeError();
            }
        } else {
            return userData;
        }
    } catch (e) {
        console.error('error in createReview: ', e);
        return makeStackTraceError(e);
    }
}

const getRestaurant = async function (restaurantId) {
    try {
        const params = {
            TableName: 'frdb',
            Key: {
                id: restaurantId,
                type: 'restaurant'
            }
        };
        const data = await ddbClient.get(params).promise();
        if (data?.Item) {
            return data.Item;
        } else {
            return null;
        }
    } catch (e) {
        console.error('error in getRestaurant: ', e);
        return null;
    }
}

const updateRestaurantRating = async function (restaurantId, reviewRating) {
    try {
        const restaurant = await getRestaurant(restaurantId);
        if (restaurant) {
            const oldTotalRating = restaurant.avg_rating * restaurant.total_ratings;
            const newRating = (oldTotalRating + reviewRating) / (restaurant.total_ratings + 1);
            restaurant.avg_rating = parseFloat(newRating.toFixed(2));
            restaurant.total_ratings = restaurant.total_ratings + 1;
            return restaurant;
        } else {
            return null;
        }
    } catch (e) {
        console.error('error in updateRestaurantRating: ', e);
        return null;
    }
}

const createRestaurant = async function (restaurant) {
    try {
        const userData = await frdbGetLoginUser.getLoginUser(restaurant.token);
        if (userData?.status === 200) {
            const user = userData.user;
            if (!user.is_admin) {
                return makeError('Operation not allowed', 401);
            }
            delete restaurant.token;
            restaurant.id = UUID4();
            const params = {
                TableName: 'frdb',
                Item: restaurant,
            };
            const data = await ddbClient.put(params).promise();
            if (data) {
                return {
                    msg: 'restaurant added successfully',
                    restaurantId: restaurant.id,
                    status: 200
                };
            } else {
                return makeError();
            }
        } else {
            return userData;
        }
    } catch (e) {
        console.error('error in createRestaurant: ', e);
        return makeStackTraceError(e);
    }
}

if (process.argv[2] === 'test') {
    const testFunction = async () => {
        if (process.argv[3] === 'restaurant') {
            const restaurantJson = require('./restaurantJson.json');
            // console.log(restaurantJson);
            const data = await createRestaurant(restaurantJson);
            console.log(data);
        } else if (process.argv[3] === 'review') {
            const reviewJson = require('./reviewJson.json');
            // console.log(reviewJson);
            const data = await createReview(reviewJson);
            console.log(data);
        }
        
    }
    testFunction();
}