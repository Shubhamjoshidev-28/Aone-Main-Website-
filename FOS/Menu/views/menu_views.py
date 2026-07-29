from rest_framework.views import (
    APIView
)
from Menu.services.menu_services import (
    MenuService
)
from Menu.models.menu import (
    Menu
)
from Menu.serializer.menu_serialzer import (
    MenuSerializer
)
from rest_framework.response import(
    Response
)
from rest_framework import (
    status
)

class CreateMenuView(
    APIView
):
    def post(
        self,
        request
    ):
        serializer=MenuSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        Menu = MenuService.create_menu(
            validated_data=serializer.validated_data
        )

        return Response(
            {
                "status":True,
                "message":"Menu Item Created Successfully",
                "menu_item":MenuSerializer(Menu).data
            },
            status=status.HTTP_201_CREATED
        )

class EditMenuView(
    APIView
):
    
    def patch(
        self,
        request,
        item_id
    ):
        serializer=MenuSerializer(
            data=request.data,
            partial=True
        )
        serializer.is_valid(
            raise_exception=True
        )
        Menu = MenuService.edit_menu(
            item_id=item_id,
            validated_data=serializer.validated_data
        )
        print(serializer.validated_data)
        return Response (
            {
                "success":True,
                "message":"Changes Saved",
                "menu_item":MenuSerializer(Menu).data
            },
            status=status.HTTP_200_OK
        )

class GetMenuView(
    APIView
):
    
    def get(
        self,
        request
    ):
        menu=MenuService.get_menu()

        serializer = MenuSerializer(
                menu,
                many=True
        )


        return Response (
            {
                "success":True,
                "message":"Menu Fetched Successfully",
                "menu":serializer.data
            },
            status=status.HTTP_200_OK
        )

class DeleteMenuView(
    APIView
):
    
    def delete(
            self,
            request,
            item_id
    ):
        menu=MenuService.delete_menu(
            item_id=item_id,  
        )
        return Response (
            {
                "success":True,
                "message":"Item Deleted Successfully",
            },
            status=status.HTTP_200_OK
        )

        

