//Renderer

//A selection of common functions used by views

export class ViewCommon {
    //The class list-group-item is added as active-important only shows up with list-group-item
    //After removing the custom class list-group-item-darker
    static selectListItem(list: JQuery<HTMLElement>, index: number) {
        list[index].classList.add(CssClasses.Active, CssClasses.ListGroupItem);
        list[index].classList.remove(CssClasses.ListGroupItemDarker);

        if (list[index].children[0] != undefined)
            list[index].children[0].classList.add(CssClasses.ActiveFont);
    }

    static deselectListItem(list: JQuery<HTMLElement>, index: number) {
        list[index].classList.remove(CssClasses.Active, CssClasses.ListGroupItem);
        list[index].classList.add(CssClasses.ListGroupItemDarker);

        if (list[index].children[0] != undefined)
            list[index].children[0].classList.remove(CssClasses.ActiveFont);
    }

    //Remove task by overwriting it with the tasks after it (n+1)
    static removeArrayItemAtIndex(items: any[], index: number) {
        for (let i = index; i < items.length; ++i) {
            //If at end of array, pop last one away since there is none after it
            if (i + 1 >= items.length) {
                items.pop();
                break;
            }

            items[i] = items[i+1];
        }
    }
}

export enum CssClasses {
    NavbarActive = "active",
    Active = "active-important",
    ActiveFont = "white-important",
    ListGroupItem = "list-group-item",
    ListGroupItemDarker = "list-group-item-darker"
}

export enum StringTags {
    NetworkingUpdateEvent = "-update",
    OpenWeatherMapKey = "open-weather-map-key",
    OpenWeatherMapLocationCity = "open-weather-map-location-city",
    GoogleDocsDocumentId = "google-docs-document-id"
}