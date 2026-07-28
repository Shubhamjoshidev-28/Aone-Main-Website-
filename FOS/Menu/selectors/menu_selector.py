from Menu.models.menu import (
    Menu
)

def get_menu_by_id(
        id
):
    menu = Menu.objects.filter(id)
    return menu


def get_menu():

   return  Menu.objects.all()