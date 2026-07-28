from Menu.selectors.menu_selector import (
    get_menu,
    get_menu_by_id
)
from Menu.models.menu import (
    Menu
)

class MenuService:

    @staticmethod
    def create_menu(
        validated_data
    ):
        menu = Menu.objects.create(
            Item_Name=validated_data("Item_Name"),
            Item_Category=validated_data("Item_Category"),
            Item_Size=validated_data("Item_Size"),
            Item_Price=validated_data("Item_Price"),
            is_available=validated_data("is_available")
        )
        return menu

    @staticmethod
    def edit_menu(
        validated_data,
        item_id
    ):
        menu=get_menu_by_id(
            item_id
        )

        if not menu :
            return None

        updated_fields =[]

        for field,value in (
            validated_data.items()
        ):
            setattr(
                menu,
                field,
                value
            )
            updated_fields.append(field)

        menu.save(
            update_fields=updated_fields
        )
        return menu

    @staticmethod
    def get_menu():
        menu=get_menu()
        return menu 

    @staticmethod
    def delete_menu(
        item_id
    ):
        menu=get_menu_by_id(
            item_id
        )

        menu.delete()

        