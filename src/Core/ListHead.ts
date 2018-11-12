

export class ListHead
{
    public Head:                        ListHead;
    public Prev:                        ListHead;
    public Next:                        ListHead;
    public Count:                       number;

    constructor()
    {
        this.Next = this.Prev = this;
        this.Head = this;
        this.Count = 0;
    }
};

export function ListInit(lhHead: ListHead): void
{
    lhHead.Next = lhHead.Prev = lhHead;
    lhHead.Head = lhHead;
    lhHead.Count = 0;
}

export function ListAdd(lhAdd: ListHead, lhPrev: ListHead, lhNext: ListHead): void
{
    lhAdd.Prev = lhPrev;
    lhAdd.Next = lhNext;

    lhPrev.Next = lhAdd;
    lhNext.Prev = lhAdd;

    lhAdd.Head = lhPrev.Head;
    lhPrev.Head.Count++;
}

export function ListAddHead(lhHead: ListHead, lhAdd: ListHead): void
{
    return ListAdd(lhAdd, lhHead, lhHead.Next);
}

export function ListAddTail(lhHead: ListHead, lhAdd: ListHead): void
{
    return ListAdd(lhAdd, lhHead.Prev, lhHead);
}

export function ListDel(lhDel: ListHead): void
{
    lhDel.Prev.Next = lhDel.Next;
    lhDel.Next.Prev = lhDel.Prev;

    lhDel.Next = lhDel.Prev = lhDel;
    lhDel.Head.Count--;
    lhDel.Head = lhDel;
    lhDel.Count = 0;
}

export function ListRemoveHead(lhHead: ListHead): ListHead
{
    if(lhHead.Count === 0) return null;

    let tmp = lhHead.Next;

    ListDel(tmp);

    return tmp;
}

export function ListRemoveTail(lhHead: ListHead): ListHead
{
    if(lhHead.Count === 0) return null;

    let tmp = lhHead.Prev;

    ListDel(tmp);

    return tmp;
}

export class List<T>
{
    private m_lhHead:                           ListHead;

    constructor()
    {
        this.m_lhHead = new ListHead();
    }

    public Push(item: T)
    {
        let lhTemp: any = new ListHead();

        lhTemp.item = item;

        ListAddTail(this.m_lhHead, lhTemp);
    }

    public PushHead(item: T)
    {
        let lhTemp: any = new ListHead();

        lhTemp.item = item;

        ListAddHead(this.m_lhHead, lhTemp);
    }

    public Pop(): T
    {
        let lhTemp: any = ListRemoveTail(this.m_lhHead);

        if(lhTemp === null) return null;

        return lhTemp.item;
    }

    public PopHead(): T
    {
        let lhTemp: any = ListRemoveHead(this.m_lhHead);

        if(lhTemp === null) return null;

        return lhTemp.item;
    }

    public Count()
    {
        return this.m_lhHead.Count;
    }
}