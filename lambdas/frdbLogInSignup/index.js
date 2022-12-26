const aws = require("aws-sdk")
const ddbClient = new aws.DynamoDB.DocumentClient({
    apiVersion: "",
    region: ""
});
const ssm = new aws.SSM({
    region: ''
});
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { makeError, makeStackTraceError } = require('/opt/nodejs/frdbMakeErrorUtil');

let jwtKey = null;

exports.handler = async function (event) {
    if (event?.email && event?.password) {
        if (event?.method === 'signup') {
            return await createUser(event);
        } else if (event?.method === 'login') {
            return await loginUser(event);
        }
    } else {
        return makeError('required fields are not present', 400);
    }
}
const createUser = async function(user) {
    try {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        const params = {
        TableName : 'frdb_user',
        Item: {
            email: user.email,
            password: hashedPassword, //add encrypted password
            name: user.name,
            avatar: user.avatar,
            is_admin: false
        },
        ConditionExpression: 'attribute_not_exists(email)'
      };
      const data = await ddbClient.put(params).promise();
      if (data) {
          const token = await createToken(user.email);
          return {
              name: user.name,
              email: user.email,
              jwt: token
          }
      } else {
        return makeError();
      }
    } catch(e) {
        console.error('error in createUser: ', e);
        if (e?.code === 'ConditionalCheckFailedException') {
            return makeError('User already exists', 400);
        }
        return makeStackTraceError(e);
    }
}

const loginUser = async function (user) {
    try {
        var params = {
            TableName: 'frdb_user',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': user.email
            }
        };

        const userData = await ddbClient.query(params).promise();
        if (userData?.Count === 1) {
            //console.log(userData?.Items[0]);
            const userItem = userData?.Items[0];
            if (bcrypt.compareSync(user.password, userItem.password)) {
                const token = await createToken(userItem.email);
                return {
                    name: userItem.name,
                    email: userItem.email,
                    jwt: token,
                    status: 200
                }
            } else {
                return makeError('Incorrect password', 400);
            }
        } else {
            return makeError('No such user', 400);
        }
    } catch (e) {
        console.error('error in LoginUser: ', e);
        return makeStackTraceError(e);
    }
}

// create json web token
//const maxAge = 3 * 24 * 60 * 60; // 3 days
const maxAge = 60 * 60; // 60 minute
const createToken = async (id) => {
  const jwtKey = await getJwtKey();
  return jwt.sign({ id }, jwtKey, {
    expiresIn: maxAge
  });
};

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

if (process.argv[2] === 'test') {
    const testFunction = async () => {
        if (process.argv[3] === 'signup') {
            const userJson = require('./userJson.json');
            const data = await createUser(userJson);
            console.log(data);
        } else if (process.argv[3] === 'login') {
            const userData = {
                email: process.argv[4],
                password: process.argv[5]
            };
            const data = await loginUser(userData);
            console.log(data);
        }
    }
    testFunction();
}