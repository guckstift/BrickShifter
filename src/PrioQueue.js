export class PrioQueue {
    constructor() {
        this.items = [];
    }

    push(value, prio) {
        let item = {value, prio};
        let item_index = this.items.length;
        this.items.push(item);

        while(item_index > 0) {
            let parent_index = (item_index - 1) >> 1;
            let parent = this.items[parent_index];

            if(parent.prio <= item.prio) {
                break;
            }

            this.items[item_index] = parent;
            this.items[parent_index] = item;
            item_index = parent_index;
        }
    }

    pop() {
        if(this.items.length <= 2) {
            return this.items.shift().value;
        }

        let result_item = this.items[0];
        let bubble_index = 0;
        let bubble_item = this.items[0] = this.items.pop();

        bubble_loop: while(true) {
            for(let i = 1; i <= 2; i ++) {
                let child_index = (bubble_index << 1) + i;
                let child_item = this.items[child_index];

                if(child_item && child_item.prio < bubble_item.prio) {
                    this.items[child_index] = bubble_item;
                    this.items[bubble_index] = child_item;
                    bubble_index = child_index;
                    continue bubble_loop;
                }
            }

            break;
        }

        return result_item.value;
    }
}