const aws = require('aws-sdk');
const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: '',
    region: ''
});
const frdbGetLoginUser = require('/opt/nodejs/frdbGetLoginUser');
const { makeError, makeStackTraceError } = require('/opt/nodejs/frdbMakeErrorUtil');

exports.handler = async function (event) {
    if (event) {
        const data = await deleteItem(event);
        return data;
    }
}

const deleteItem = async function (item) {
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
                ConditionExpression: 'attribute_exists(id)'
            };
            const data = await ddbClient.delete(params).promise();
            return data ? getSuccessfulResponse(item.type) : makeError();
        } else {
            return userData;
        }
    } catch (e) {
        console.error('error in deleteRestaurant: ', e);
        if (e?.code === 'ConditionalCheckFailedException') {
            return makeError(item.type + ' not found', 404);
        }
        return makeStackTraceError(e);
    }
}

const getSuccessfulResponse = function (itemType) {
    return {
        msg: 'successfully deleted ' + itemType,
        status: 200
    };
}

if (process.argv[2] === 'test') {
    const testFunction = async () => {
        const itemType = process.argv[3];
        const itemData = require(`./${itemType}Json.json`);
        const data = await deleteItem(itemData);
        console.log(data);
    }
    testFunction();
}