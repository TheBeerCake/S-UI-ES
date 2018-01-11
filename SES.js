
var steemUSD,
    steemEUR,
    sbdUSD,
    sbdEUR = 0;
var sbdChange,
    steemChange = "+0";
var sbdColor,
    steemColor = "gray";

var lastPostCount = 0;



var throtled =   _.throttle( postListChanges,1000);
function postListChanges() {
   console.log("post list modified");
   let postCount =   $(".PostsList__summaries").find("li").length;
    if(lastPostCount != postCount){
        updatePrices();
        lastPostCount=postCount;
    }
   

}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    lastPostCount =0 ;
    setTimeout(function(){
        updatePrices();
        console.log("updated once");
        $("#posts_list").bind("DOMSubtreeModified", throtled);
    },300);
});


window.addEventListener("hashchange", hashChanged);
   function hashChanged(){
    console.log("page changed");
   }

$( document ).ready(function() {
    getSTEEM();
    getSBD();
    setInterval(function(){
        getSTEEM();
        getSBD();
        updatePrices();
      
    },600000);
    setTimeout(() => {
        updatePrices();
    }, 1500);


    
});

function updatePrices(){

    let posts = $(".Voting__inner");

    $.each(posts,function(key,el){
         let post = $(el);

        let integer = post.find(".integer").html().replace(",", "");
        let decimal =  post.find(".decimal").html().substring(1, post.find(".decimal").html().length);
        let summVal = +integer + (+decimal)/100;
        let youGet = summVal*0.75;

        let youGetSP = (youGet/2)/steemUSD;
        let youGetSBD = (youGet/2)*sbdUSD;
        let prices = " ( $"+ ((youGetSBD)).toFixed(2) + " USD <span style='font-size:9px; color:"+sbdColor+";'>"+sbdChange+"</span> , " + youGetSP.toFixed(2)+"SP  <span style='font-size:9px; color:"+steemColor+";'>"+steemChange+"</span>)";
        if(post.find(".convertedValue").length > 0){
            console.log("added prices")
            post.find(".convertedValue").html(prices);
          
        }else{
            console.log("updated prices")
            prices = "<div class='convertedValue' style='display:inline-block;margin:0px -2px 0 15px;' >" + prices + "</div>";
            post.append(prices);
            
        }
    });
}
function getSTEEM(){
    $.getJSON( "https://api.coinmarketcap.com/v1/ticker/steem/", function( data ) {
        
        $.each( data, function( key, val ) {
            steemUSD = data[0].price_usd;
            steemEUR =steemUSD*0.84;
            
            steemChange = data[0].percent_change_24h;
            let steem = parseFloat(steemUSD).toFixed(2);
            if(data[0].percent_change_24h >0){
                steemColor="#06D6A9";
                steemChange = " "+steem+"$  ( +"+steemChange+"% /24h )";
            }else{
                steemColor= "#d60606";
                steemChange = " "+steem+"$  ( "+steemChange+"% /24h )";
            }
            updatePrices();
        });
        
     
    });
}
function getSBD(){
    $.getJSON( "https://api.coinmarketcap.com/v1/ticker/steem-dollars/", function( data ) {
        sbdUSD = data[0].price_usd;
        sbdEUR =sbdUSD*0.84;
        sbdChange = data[0].percent_change_24h;
        let sbd = parseFloat(sbdUSD).toFixed(2);
        if(data[0].percent_change_24h >0){
            sbdColor="#06D6A9";
            sbdChange = " "+sbd+"$  ( +"+sbdChange+"% /24h )";
        }else{
            sbdColor= "#d60606";
            sbdChange = " "+sbd+"$  ( "+sbdChange+"% /24h )";
        }
        updatePrices();

    });
}