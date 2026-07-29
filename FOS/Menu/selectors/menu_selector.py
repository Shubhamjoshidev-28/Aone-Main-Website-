from Menu.models.menu import (
    Menu
)

def get_menu_by_id(
       item_id
):
    menu = Menu.objects.filter(id=item_id).first()
    return menu


def get_menu():

   return  Menu.objects.all()