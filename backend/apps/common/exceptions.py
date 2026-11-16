from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        code = getattr(exc, "default_code", "error")
        message = "An error occurred."

        if isinstance(response.data, dict):
            if "detail" in response.data:
                message = str(response.data["detail"])
                details = {}
            else:
                details = response.data
                message = "Validation error. Please verify the submitted data."
                code = "validation_error"
        elif isinstance(response.data, list):
            details = {"non_field_errors": response.data}
            message = "Validation error."
            code = "validation_error"
        else:
            details = {"detail": str(response.data)}

        formatted_data = {
            "status": "error",
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
        }
        response.data = formatted_data
        return response

    return response
