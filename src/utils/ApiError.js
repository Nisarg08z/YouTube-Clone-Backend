class ApiError extends Error {
    constructor(
        message = "something went wrong", 
        status,
        error = [],
        stack = "" 
    ) {
        super(message);
        this.status = status;
        this.data = null;
        this.message = message;
        this.success = false;
        this.error = error;

        if(stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

export {ApiError}