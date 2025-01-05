class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went Wrong",
        errors = [],
        statck = ""
    ){
       super(message)
       this.statusCode = statusCode
       this.data = null
       this.mesaage = message
       this.sucess = false;
       this.errors = errors

       if (statck) {
        this.stack = statck

       } else {
          Error.captureStackTrace(this, this. constructor)
       }

    }
}

export {ApiError}