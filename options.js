// Saves options to chrome.storage.sync.
function save_options() {

  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restore_options() {

    chrome.storage.local.get("blacklist", function (items) {    
        if (!_.isEmpty(items.blacklist)) {
            let list = items.blacklist;
            let blist = [];
            $.each(list,function(item,val){
                if(val){
                    blist.push(item);
                }
            });
            $('#blacklist').tagEditor({ 
                initialTags:blist,
                placeholder: 'Enter usernames ...',
              
            }
            );
        } else {
            $('#blacklist').tagEditor();
        }
    });
    chrome.storage.local.get("whitelist", function (items) {
        if (!_.isEmpty(items.whitelist)) {
            let list = items.whitelist;
            let wlist = [];
            $.each(list,function(item,val){
                if(val){
                    wlist.push(item);
                }
            });
            $('#whitelist').tagEditor({ 
                initialTags:wlist,
                placeholder: 'Enter usernames ...',
               });
        } else {
            $('#whitelist').tagEditor();
        }
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save-bl').addEventListener('click',updateBlist);
  document.getElementById('save-wl').addEventListener('click',updateWlist);

function updateBlist(){
    let tags = $('#blacklist').tagEditor('getTags')[0].tags;
    let list = {};
    $.each(tags,function(id,val){
        list[val]=true;
    });
    chrome.storage.local.set({
        "blacklist": list
    }, function (a) {
        $('.b-status').addClass("active");
        setTimeout(function(){ $('.b-status').removeClass("active");},1000)
    });

}
function updateWlist(){
    let tags = $('#whitelist').tagEditor('getTags')[0].tags;
    let list = {};
    $.each(tags,function(id,val){
        list[val]=true;
    });
    chrome.storage.local.set({
        "whitelist": list
    }, function (a) {
        $('.w-status').addClass("active");
        setTimeout(function(){ $('.w-status').removeClass("active");},1000)
    });

}