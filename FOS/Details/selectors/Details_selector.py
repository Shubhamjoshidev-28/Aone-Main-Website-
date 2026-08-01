from Details.models.details import (
    Details
)

def get_staff_by_id(
        id
):
    return Details.objects.filter(
        Role = "Staff"
    )

def get_owner_by_id(
        id
):
    return Details.objects.filter(
        Role = "Owner"
    )
