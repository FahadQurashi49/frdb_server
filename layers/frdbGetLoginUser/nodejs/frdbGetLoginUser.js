const aws = require('aws-sdk');
const jwt = require('jsonwebtoken');

const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: '',
    region: ''
});
const ssm = new aws.SSM({
    region: ''
});

let jwtKey = null;

const getJwtKey = async function () {
    if (!jwtKey) {
        var jwtKeyParams = {
            Name: 'frdb_jwt',
            WithDecryption: false
        };
        const ssmParam = await ssm.getParameter(jwtKeyParams).promise();
        jwtKey = ssmParam?.Parameter?.Value ? ssmParam.Parameter.Value : null
    } else {
    }
    return jwtKey;
}


const checkLogin = async function(token) {
    try {
        const jwtKey = await getJwtKey();
        const decoded = jwt.verify(token, jwtKey);
        return decoded.id;
      } catch (err) {
        console.log('error in verifying token', err);
        return null;
      }
}

const getLoginUser = async function (token) {
    try {
        const userId = await checkLogin(token);
        if (userId) {
            var params = {
                TableName: 'frdb_user',
                Key: {
                    email: userId
                }
            };
            const data = await ddbClient.get(params).promise();
            const user = data.Item;
            delete user.password;
            return {
                    user,
                    status: 200
                };
        } else {
            return makeError('Invalid token', 401);
        }
    } catch (e) {
        console.error('error in LoginUser: ', e);
        return makeError('Something went wrong', 500, e);
    }
}

const makeError = function (error, status, errorStack) {
    const errorJson = {
        error : (error ? error : 'Something went wrong'),
        status : (status ? status : 500),
        errorStack: (errorStack ? errorStack : ''),
    }
    if (!errorJson.errorStack) {
        delete errorJson.errorStack;
    }
    return errorJson;
};

module.exports.getLoginUser = getLoginUser;


if (process.argv[2] === 'test') {
    const testFunction = async () => {
        const data = await getLoginUser(process.argv[3]);
        console.log(data);
    }
    testFunction();
}

/*
node frdbCheckLogin.js test "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZyZWRpZUBhYmNkLmNvbSIsImlhdCI6MTY2NjUzNjI0NiwiZXhwIjoxNjY2NTM5ODQ2fQ.U6ZHGjMZLiQbxqhvYAK6dWmPEKH5ab8GNr2sIZ9nKVE"
*/