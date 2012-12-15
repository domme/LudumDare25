var monsterNameSpace = (function(ns)
{
    ns.SaveGameHandler = function()
    {
        this.fn = [];
    };

    ns.SaveGameHandler.prototype.set = function(key, value)
    {
        localStorage.setItem(key, JSON.stringify(value));
        this.notifyObserver(key, value);
    };

    ns.SaveGameHandler.prototype.get = function(key, defaultValue)
    {
        var value = localStorage.getItem(key);
        return value==null?defaultValue:JSON.parse(value);
    };

    ns.SaveGameHandler.prototype.attachObserver = function(key, fn)
    {
        if(this.fn[key] == undefined)
        {
            this.fn[key] = [];
        }
        this.fn[key].push(fn);
        return this.fn[key].length-1;
    };

    ns.SaveGameHandler.prototype.notifyObserver = function(key, value)
    {
        for(var i = 0, fn = null;fn=this.fn[key][i];++i)
        {
            fn({'key':key,'value':value});
        }
    };

    return ns;
})(monsterNameSpace = monsterNameSpace || {});