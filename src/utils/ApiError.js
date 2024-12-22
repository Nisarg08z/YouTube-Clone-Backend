class ApiError extends Error {
    constructor(
        message = "something went wrong", 
        status,
        error = [],
        statck = "" 
    ) {
        super(message);
        this.status = status;
        this.data = null;
        this.message = message;
        this.success = false;
        this.error = error;

        if(statck) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

export {ApiError}