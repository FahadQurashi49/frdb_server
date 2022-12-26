const defaultErrorMsg = 'Something went wrong';
const defaultErrorStatus = 500;
const makeError = function(error = defaultErrorMsg, 
                           status = defaultErrorStatus, 
                           errorStack) {
    const errorJson = {
        error,
        status
    }
    if (errorStack) {
        errorJson.errorStack = errorStack;
    }
    return errorJson;
};

const makeStackTraceError = function(errorStack = '') {
    return makeError(defaultErrorMsg, defaultErrorStatus, errorStack);
}

module.exports = {
    makeError,
    makeStackTraceError
};