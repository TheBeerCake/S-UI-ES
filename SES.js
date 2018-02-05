steem.api.setOptions({
    websocket: 'wss://rpc.buildteam.io'
});
var steemUSD,
    sbdUSD = 0;
var sbdChange,
    steemChange = "+0";
var sbdDelta,
    steemDelta = "";
var oldUrl = "";
var lastPostCount = 0;
var hideResteems = false;
var localUser = "";
var filterWhite = false;

var throtledDOMChanges = _.throttle(postListChanges, 1000);
var throtledUpdatePrices = _.throttle(updatePrices, 300);
var throtledUpdateResteems = _.throttle(updateResteems, 300);



function postListChanges() {
    //console.log("post list modified");
    let postCount = $(".PostsList__summaries").find("li").length;
    if (lastPostCount != postCount) {
        throtledUpdatePrices();
        throtledUpdateResteems();
        lastPostCount = postCount;
    }
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    lastPostCount = 0;
    if (hasURLChanged()) {
        onURLChange();
    }
});


$(document).ready(function () {
    getTabURL();
    getSTEEM();
    getSBD();
    updateWhitelist();
    updateBlacklist();
    setInterval(function () {
        getSTEEM();
        getSBD();
    }, 600000);
    setTimeout(() => {
        throtledUpdatePrices();
    }, 1000);
    $("html").on("tap click", () => {
        setTimeout(() => {
            throtledUpdatePrices();
            throtledUpdateResteems();
            setTimeout(() => {
                updateUserVP();
            }, 3000);
        }, 150);

    })
    $.initialize('.Voting__inner', function () {
        throtledUpdatePrices();
        throtledUpdateResteems();
        setTimeout(() => {
            filterWhitelist();
        }, 100);
        //console.log("detected new posts");

    });
    $.initialize('.Header__userpic ', () => {
        let el = $(".Header__userpic ").find(".Userpic");
        let picUrl = el.css('background-image').replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        localUser = picUrl.split("/")
        localUser = localUser[localUser.length - 2];
        updateUserVP();
    });
    $.initialize('.Author', (idx, el) => {
        el = $(el);
        let authorName = el.find(".ptc").text().split(" ")[0];

        let wlButton = '<div class="wl-button" data-user="' + authorName + '"></div>';
        let blButton = '<div class="bl-button" data-user="' + authorName + '"></div>';
        wlButton = $(wlButton);
        blButton = $(blButton);
        wlButton.on("tap click", () => {
            toggleWhitelist(authorName);

        });
        blButton.on("tap click", () => {
            toggleBlacklist(authorName);

        });
        el.append(wlButton);
        el.append(blButton);
        updateWhitelist();
        updateBlacklist();
    });
    $.initialize(".articles__summary-header", (idx, el) => {
        el = $(el);
        let authorName = el.find(".user__name").find("a").text().split(" ")[0];
        let wlButton = '<div class="wl-button" data-user="' + authorName + '"></div>';
        let blButton = '<div class="bl-button" data-user="' + authorName + '"></div>';
        wlButton = $(wlButton);
        blButton = $(blButton);
        wlButton.on("tap click", () => {
            toggleWhitelist(authorName);
        });
        blButton.on("tap click", () => {
            toggleBlacklist(authorName);
        });
        el.find(".user").append(wlButton);
        el.find(".user").append(blButton);
        updateWhitelist();
        updateBlacklist();
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
        let priceChangesSBD = "<div class='c-stats'> <div class='price'>" + (+sbdUSD).toFixed(3) + "$" + "<div class='delta " + sbdDelta + "'>" + sbdChange + "</div></div><div class='name'>STEEM DOLLARS (SBD)</div></div>";
        let priceChangesSP = "<div class='c-stats'> <div class='price'>" + (+steemUSD).toFixed(3) + "$" + "<div class='delta " + steemDelta + "'>" + steemChange + "</div></div><div class='name'>STEEM (STEEM)</div></div>";
        let totalSBD = "<div class='total-value sep'>" + (youGet / 2).toFixed(2) + " SBD TOTAL</div>";
        let totalSP = "<div class='total-value '>" + (youGetSP).toFixed(2) + " SP TOTAL</div>";
        let popup = '<div class="ses-price-popup">' + priceChangesSBD + totalSBD + priceChangesSP + totalSP + '<div class="grad-line"></div></div>';

        let prices = "( " + (youGetSBD).toFixed(2) + " USD  , " + (youGetSP).toFixed(2) + " SP )" + popup;
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

function getTabURL() {
    return window.location.href;
}

function hasURLChanged() {
    let newUrl = getTabURL();
    if (oldUrl == newUrl) {
        return false;
    } else {
        oldUrl = newUrl;
        return true;
    }
}

function onURLChange() {
    resetPostUrlChange();
    updateUserVP();
    updateWhitelist();
    updateBlacklist();
    let url = window.location.href.split("/");
    let inFeed = _.contains(url, "feed");
    let inNew = _.contains(url, "created");
    let inTrending = _.contains(url, "trending");
    let inWallet = _.contains(url, "transfers");
    let inProfile = (url.length >= 4) && url[3].indexOf("@") > -1;
    let inProfileFeed = (url.length == 4) && url[3].indexOf("@") > -1 || (url.length == 5) && url[3].indexOf("@") > -1 && url[4] == "feed";
    //console.log("feed",inFeed," new",inNew," in trending", inTrending,"in wallet", inWallet,"In profile",inProfile,"in profile feed",inProfileFeed);
    if (inProfileFeed) {
        setTimeout(() => {
            addResteemFilter();
            addlistFilters();
        }, 150);
    }
    throtledUpdatePrices();
}

function resetPostUrlChange() {
    hideResteems = false;
    $("#ses-hide-resteem").remove();
}

var resteemIcon = '<span id="ses-hide-resteem" class="Icon reblog" style="display: block; "><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><path d="M448,192l-128,96v-64H128v128h248c4.4,0,8,3.6,8,8v48c0,4.4-3.6,8-8,8H72c-4.4,0-8-3.6-8-8V168c0-4.4,3.6-8,8-8h248V96 L448,192z"></path></svg></span>';

function addResteemFilter() {
    //console.log("add resteem button");

    let header = $(".articles__header");
    if (header.length) {
        if (!header.find(".reblog").length) {
            header.append(resteemIcon);
            hideResteems = false;
            $("#ses-hide-resteem").on("click tap", function () {
                hideResteems = !hideResteems;
                $("#ses-hide-resteem").toggleClass("active");
                updateResteems();
            });
        }
    }
}

function updateResteems() {
    //console.log("Updated resteems");

    let articles = $(".articles__summary");
    $.each(articles, function (key, el) {
        let article = $(el);
        if (hideResteems) {
            if (article.find(".articles__resteem").length > 0) {
                article.addClass("rest-hide");
            }
        } else {
            article.removeClass("rest-hide");
        }
    });
}

function updateUserVP() {
    let progress = 0;
    steem.api.getAccounts([localUser], function (err, result) {
        if (result[0]) {
            var secondsago = (new Date - new Date(result[0].last_vote_time + "Z")) / 1000;
            vpow = result[0].voting_power + (10000 * secondsago / 432000);
            progress = Math.min(vpow / 100, 100);
            let timeToFull = (100 - progress) / 0.0139344262295082;
            let hours = Math.floor(timeToFull / 60);
            let minutes = Math.ceil(timeToFull % 60);
            let progressbar = '<div class="user-vp">' +
                '  <div class="vp-value">' + progress.toFixed(2) + '% VP</div>' +
                '  <div class="vp-progress"><div class="vp-progress-value" style="width:' + progress.toFixed(2) + 'px;"></div></div>' +
                '  <div class="vp-full-in">' + hours + 'h ' + minutes + 'min till 100%</div>' +
                '</div>';
            let div = $(".Header__top.header").find(".columns.shrink")
            if (div.find(".user-vp").length > 0) {
                div.find(".user-vp").remove();
                div.prepend(progressbar);
            } else {
                div.prepend(progressbar);
            }
        }
    });
}

// white list and black list
function toggleWhitelist(name) {
    let list = {};
    chrome.storage.local.get("whitelist", function (items) {
        //  items = [ { "yourBody": "myBody" } ]

        if (!_.isEmpty(items.whitelist)) {
            list = items.whitelist;
            if (_.has(list, name)) {
                list[name] = !list[name];
            } else {
                list[name] = true;
            };
        } else {
            list[name] = true;
        }

        chrome.storage.local.set({
            "whitelist": list
        }, function (a) {});
        updateWhitelist();
    });
}

function toggleBlacklist(name) {
    let list = {};
    chrome.storage.local.get("blacklist", function (items) {
        //  items = [ { "yourBody": "myBody" } ]

        if (!_.isEmpty(items.blacklist)) {
            list = items.blacklist;
            if (_.has(list, name)) {
                list[name] = !list[name];
            } else {
                list[name] = true;
            };
        } else {
            list[name] = true;
        }

        chrome.storage.local.set({
            "blacklist": list
        }, function (a) {});
        updateBlacklist();
    });
}

function updateWhitelist() {
    let whitelist = {};
    chrome.storage.local.get("whitelist", function (items) {
        whitelist = items.whitelist;
        if (!_.isEmpty(whitelist)) {
            let buttons = $(".wl-button");
            $.each(buttons, (idx, button) => {
                let usrName = $(button).attr("data-user");
                if (_.has(whitelist, usrName)) {
                    if (whitelist[usrName]) {
                        $(button).addClass("active");
                    } else {
                        $(button).removeClass("active");
                    }

                } else {
                    $(button).removeClass("active");
                };
            });
        }
    });
}

// function isWhitelisted(name) {
//     var found = false;
//     chrome.storage.local.get("whitelist", function (items) {

//         let whitelist = items.whitelist;

//         if (_.has(whitelist, name)) {
//             found = true;
//             return found;
//         } else {
//             found = false;
//             return found;
//         }
//     });
// }

function updateBlacklist() {
    let blacklist = {};
    chrome.storage.local.get("blacklist", function (items) {
        blacklist = items.blacklist;
        if (!_.isEmpty(blacklist)) {
            let buttons = $(".bl-button");
            $.each(buttons, (idx, button) => {
                let usrName = $(button).attr("data-user");
                if (_.has(blacklist, usrName)) {
                    if (blacklist[usrName]) {
                        $(button).addClass("active");
                    } else {
                        $(button).removeClass("active");
                    }

                } else {
                    $(button).removeClass("active");
                };
            });
        }
    });
}

function addlistFilters() {
    console.log("add whitelist filter");

    $("ses-toggle-button").remove();
    var whitelistToggle = '<span id="ses-toggle-whitelist" class="ses-toggle-button" ><div class="ses-icon"></span>';
    whitelistToggle = $(whitelistToggle);
    whitelistToggle.on("tap click", () => {
        $("#ses-toggle-whitelist").toggleClass("active");
        filterWhite = $("#ses-toggle-whitelist").hasClass("active");
        console.log("filter white", filterWhite);

        filterWhitelist();
    });
    $(".articles__header").append(whitelistToggle);
}

function filterWhitelist() {
    if (filterWhite) {

        let articles = $(".articles__summary");
        $.each(articles, function (key, el) {
            let article = $(el);
            let authorName = article.find(".author").find("a").text().split(" ")[0];
            if (!article.find(".wl-button.active").length) {
                article.addClass("whitelist-hide");
            }
        });
    } else {
        $(".articles__summary").removeClass("whitelist-hide");
    }
}