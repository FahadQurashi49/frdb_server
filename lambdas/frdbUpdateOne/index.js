const aws = require('aws-sdk');
const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: '',
    region: ''
});
const frdbGetLoginUser = require('/opt/nodejs/frdbGetLoginUser');
const { makeError, makeStackTraceError } = require('/opt/nodejs/frdbMakeErrorUtil');

const restaurantAttributes = [
    'restaurant_name',
    'description',
    '#location',
    'logo'
];

const reviewAttributes = [
    'review_text',
    'rating',
    'imgs'
];

exports.handler = async function (event) {
    if (event) {
        const data = await updateItem(event);
        return data;
    }
}

const updateItem = async function (item) {
    try {
        const userData = await frdbGetLoginUser.getLoginUser(item.token);
        if (userData?.status === 200) {
            const isReview = item.type === 'review';
            const user = userData.user;
            if (!isReview && !user.is_admin) {
                return makeError('Operation not allowed', 401);
            }
            const params = {
                TableName: 'frdb',
                Key: {
                    id: item.id,
                    type: item.type
                },
                UpdateExpression: getUpdateExpression(item, isReview),
                ExpressionAttributeValues: getAttributeValues(item, isReview),
                ConditionExpression: 'attribute_exists(id)'
            };
            if (item.location) {
                params.ExpressionAttributeNames = {
                    '#location': 'location'
                }
            }
            const data = await ddbClient.update(params).promise();
            console.log(data);
            return data ? getSuccessfulResponse(item.type) : makeError();
        } else {
            return userData;
        }
    } catch (e) {
        console.error('error in updateRestaurant: ', e);
        if (e?.code === 'ConditionalCheckFailedException') {
            return makeError(item.type +  ' not found', 404);
        }
        return makeStackTraceError(e);
    }
}

const getUpdateExpression = function (item, isReview = false) {
    let exp = 'set';
    const attributes = isReview ? reviewAttributes : restaurantAttributes;
    attributes.forEach(attr => {
        const attribute = attr.replace('#', '');
        if (item[attribute]) {
            exp += (` ${attr} = :${attribute},`);
        }
    });
    return exp.slice(0, -1);
}

const getAttributeValues = function(item, isReview = false) {
    const attributes = isReview ? reviewAttributes : restaurantAttributes;
    const attrValuesMap = new Map();
    attributes.forEach(attr => {
        const attribute = attr.replace('#', '');
        if (item[attribute]) {
            attrValuesMap.set(`:${attribute}`, item[attribute]);
        }
    });
    return Object.fromEntries(attrValuesMap);
}

const getSuccessfulResponse = function (itemType) {
    return {
        msg: 'successfully updated ' + itemType,
        status: 200
    };
}

if (process.argv[2] === 'test') {
    const testFunction = async () => {
        const itemType = process.argv[3];
        const itemData = require(`./${itemType}Json.json`);
        const data = await updateItem(itemData);
        console.log(data);

    }
    testFunction();
}