var steemUSD,
    sbdUSD = 0;
var sbdChange,
    steemChange = "+0";
var sbdDelta,
    steemDelta = "";
var oldUrl = "";
var lastPostCount = 0;
var hideResteems = false;



var throtledDOMChanges = _.throttle(postListChanges, 1000);
var throtledUpdatePrices = _.throttle(updatePrices, 300);
var throtledUpdateResteems = _.throttle(updateResteems, 300);

function postListChanges() {
    console.log("post list modified");
    let postCount = $(".PostsList__summaries").find("li").length;
    if (lastPostCount != postCount) {
        throtledUpdatePrices();
        throtledUpdateResteems();
        lastPostCount = postCount;
    }
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    lastPostCount = 0;
    if(hasURLChanged()){
        onURLChange();
    }
});


$(document).ready(function () {
    getTabURL();
    getSTEEM();
    getSBD();
    setInterval(function () {
        getSTEEM();
        getSBD();
    }, 600000);
    setTimeout(() => {
        throtledUpdatePrices();
    }, 1000);
    $("html").on("tap click",()=>{
        setTimeout(() => {
            throtledUpdatePrices();
            throtledUpdateResteems();
        }, 150);
       
    })
    $.initialize('.Voting__inner', function () {
        throtledUpdatePrices();
        throtledUpdateResteems();
        console.log("detected new posts");
        
    });
});

function updatePrices() {
    let posts = $(".Voting__inner");
    $.each(posts, function (key, el) {
        let post = $(el);

        let integer = post.find(".integer").html().replace(",", "");
        let decimal = post.find(".decimal").html().substring(1, post.find(".decimal").html().length);
        let summVal = +integer + (+decimal) / 100;
        let youGet = summVal * 0.75;

        let youGetSP = (youGet / 2) / steemUSD;
        let youGetSBD = (youGet / 2) * sbdUSD;
        let priceChangesSBD = "<div class='c-stats'> <div class='price'>" +sbdUSD+"$" +"<div class='delta "+sbdDelta+"'>"+sbdChange +"</div></div><div class='name'>STEEM DOLLARS (SBD)</div></div>";
        let priceChangesSP = "<div class='c-stats'> <div class='price'>" +steemUSD+"$" +"<div class='delta "+steemDelta+"'>"+steemChange +"</div></div><div class='name'>STEEM (STEEM)</div></div>";
        let popup ='<div class="ses-price-popup">'+priceChangesSBD+priceChangesSP+'</div>';

        let prices = "( " + (youGetSBD).toFixed(2) + " USD  , " + (youGetSP).toFixed(2) + " SP )"+popup;
        if (post.find(".convertedValue").length > 0) {
            // console.log("added prices")
            post.find(".convertedValue").html(prices);

        } else {
            // console.log("updated prices")
            prices = "<div class='convertedValue' >" + prices + "</div>";
            post.append(prices);

        }
    });
}

function getSTEEM() {
    $.getJSON("https://api.coinmarketcap.com/v1/ticker/steem/", function (data) {

        $.each(data, function (key, val) {
            steemUSD = data[0].price_usd;
            steemChange = data[0].percent_change_24h;
            let steem = parseFloat(steemUSD).toFixed(2);
            if (data[0].percent_change_24h > 0) {
                steemDelta = "positive";
                steemChange = " +" + steemChange + "% /24h";
            } else {
                steemDelta = "negative";
                steemChange = " " + steemChange + "% /24h";
            }
            throtledUpdatePrices();
        });


    });
}

function getSBD() {
    $.getJSON("https://api.coinmarketcap.com/v1/ticker/steem-dollars/", function (data) {
        sbdUSD = data[0].price_usd;
        sbdEUR = sbdUSD * 0.84;
        sbdChange = data[0].percent_change_24h;
        let sbd = parseFloat(sbdUSD).toFixed(2);
        if (data[0].percent_change_24h > 0) {
            sbdDelta = "positive";
            sbdChange = "  +" + sbdChange + "% /24h";
        } else {
            sbdDelta = "negative";
            sbdChange = "  " + sbdChange + "% /24h";
        }
        throtledUpdatePrices();

    });
}
function getTabURL(){
    return window.location.href;
}
function hasURLChanged(){
    let newUrl = getTabURL();
    if(oldUrl == newUrl){
        return false;
    }else{
        oldUrl = newUrl;
        return true;
    }
}

function onURLChange(){
    resetPostUrlChange();
    let url = window.location.href.split("/");   
    let inFeed = _.contains(url,"feed");
    let inNew = _.contains(url,"created");
    let inTrending = _.contains(url,"trending");
    let inWallet = _.contains(url,"transfers");
    let inProfile = (url.length >= 4) && url[3].indexOf("@") > -1;
    let inProfileFeed = (url.length == 4) && url[3].indexOf("@") > -1 || (url.length == 5) && url[3].indexOf("@") > -1 && url[4] == "feed"; 
    //console.log("feed",inFeed," new",inNew," in trending", inTrending,"in wallet", inWallet,"In profile",inProfile,"in profile feed",inProfileFeed);
    if(inProfileFeed){
       setTimeout(()=>{ addResteemFilter()},150);
    }
    throtledUpdatePrices();
}

function resetPostUrlChange(){
    hideResteems=false;
    $("#ses-hide-resteem").remove();
}

var resteemIcon = '<span id="ses-hide-resteem" class="Icon reblog" style="display: block; "><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><path d="M448,192l-128,96v-64H128v128h248c4.4,0,8,3.6,8,8v48c0,4.4-3.6,8-8,8H72c-4.4,0-8-3.6-8-8V168c0-4.4,3.6-8,8-8h248V96 L448,192z"></path></svg></span>';
function addResteemFilter(){
    //console.log("add resteem button");
   
    let header = $(".articles__header");
    if(header.length){
        if(!header.find(".reblog").length){
            header.append(resteemIcon);
            hideResteems = false;
            $("#ses-hide-resteem").on("click tap",function(){
                hideResteems = !hideResteems;
                $("#ses-hide-resteem").toggleClass("active");
                updateResteems();
            })
        }
    }
}
function updateResteems(){
   //console.log("Updated resteems");
   
    let articles = $(".articles__summary");
    $.each(articles,function (key, el) {
        let article = $(el);
        if(hideResteems){
            if(article.find(".articles__resteem").length > 0){
                article.addClass("rest-hide");
            }
        }else{
            article.removeClass("rest-hide");
        }
    });
}