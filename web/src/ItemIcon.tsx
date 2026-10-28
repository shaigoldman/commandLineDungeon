import type { Item } from "../shared/types";
import { itemIcon } from "./item-art";
export function ItemIcon({
  item,
  large = false,
}: {
  item: Item;
  large?: boolean;
}) {
  return (
    <img
      className={"item-icon" + (large ? " item-icon-large" : "")}
      src={itemIcon(item)}
      alt={item.name + " sprite"}
      draggable={false}
    />
  );
}
