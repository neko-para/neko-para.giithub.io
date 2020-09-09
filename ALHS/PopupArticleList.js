// ==UserScript==
// @name         艾利浩斯图书馆弹出式文章列表
// @namespace    https://ailihaosi.xyz/
// @version      0.3.3
// @description  在主页和各类合集中生成一个包含本页文章主要信息的表格
// @author       nekosu
// @include      https://ailihaosi.xyz/
// @include      https://ailihaosi.xyz/index.php/page/*/
// @include      https://ailihaosi.xyz/index.php/archives/category/*/
// @include      https://ailihaosi.xyz/index.php/archives/tag/*/
// @grant        none
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
	let nav = $('#site-navigation');
	if (nav.length == 0) {
		nav = $('#sticky-navigation');
	}
	let theme = nav.css('background-color');
    let style = document.createElement('style');
    style.innerText = `
.ALHS_PAL_PAGEW {
    position:fixed;
    z-index:101;
    left:50%;
    top:92px;
    width:1100px;
    padding:10px 10px;
    transform:translate(-50%,0);
    background:${theme};
    transition:all 1s;
    display:flex;
    flex-direction:column;
}
#ALHS_PAL_PAGEW_I {
    opacity:1;
    pointer-events: auto;
}
#ALHS_PAL_PAGEW_O {
    opacity:0;
    pointer-events: none;
}
#ALHS_PAL_PAGE::-webkit-scrollbar {
    display:none
}
#ALHS_PAL_PAGE {
    overflow:auto;
    width:1100px;
    max-height:400px;
    margin-bottom:10px;
}
#ALHS_PAL_PAGE_NV {
    display:none;
    width:1100px;
    height:40px;
    flex-direction:row;
    flex-wrap:wrap;
}
#ALHS_PAL_PAGE_NV a {
    width:40px;
    height:40px;
    line-height:40px;
    text-align:center;
    margin-right:10px;
    background:rgba(255,255,255,0.75);
    white-space:nowrap;
}
#ALHS_PAL_PAGE_NV a.ALHS_PAL_NV_CUR {
    background:rgb(255,255,255);
}
#ALHS_PAL_POPUP {
    border-radius:50%;
    position:fixed;
    z-index:101;
    right:0px;
    top:32px;
    width:60px;
    height:60px;
    background:${theme};
}
#ALHS_PAL_POPUP_IN {
    border-radius:50%;
    position:absolute;
    left:5px;
    top:5px;
    width:50px;
    height:50px;
    background:rgba(255,255,255,0.75);
}
#ALHS_PAL_TABLE {
    border:0px;
    margin:0px 0px;
}
#ALHS_PAL_TABLE td {
    background:rgba(255,255,255,0.75);
}
.ALHS_PAL_PAGE_TAG a {
    white-space:nowrap;
    padding:0px 5px;
}
`;
    document.body.appendChild(style);
    let mousein = 0;
    let popup = document.createElement('div');
    let popupin = document.createElement('div');
    let pageW = document.createElement('div');
    let page = document.createElement('div');
    let pageNv = document.createElement('div');
    let timer = null;
    let maxpage = null, curpage = null, urlpat = null;

    function show(s) {
        pageW.setAttribute('id', 'ALHS_PAL_PAGEW_' + (s ? 'I' : 'O'));
    }
    function prepareHide() {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            if (mousein == 0) {
                show(false);
            }
            timer = null;
        }, 1000);
    }
    popup.setAttribute('id', 'ALHS_PAL_POPUP');
    popupin.setAttribute('id', 'ALHS_PAL_POPUP_IN');
    popup.appendChild(popupin);
    let table = document.createElement('table');
    table.setAttribute('id', 'ALHS_PAL_TABLE');
    let main = document.getElementById('main');
    $('#main article').each(function() {
        let title = $(this).find('.entry-title').children();
        let author = $(this).find('.author').children();
        let cata = $(this).find('.cat-links').children().filter('a');
        let tag = $(this).find('.tags-links').children().filter('a');
        let tr = document.createElement('tr');
        let createItem = (t, u) => {
            let i = document.createElement('a');
            i.setAttribute('href', u);
            i.innerText = t;
            return i;
        }
        let eT = document.createElement('td');
        eT.setAttribute('style', 'width:40%');
        if (title.length == 1) {
            eT.appendChild(createItem(title.text(), title.attr('href')));
        }
        tr.appendChild(eT);
        let eA = document.createElement('td');
        eA.setAttribute('style', 'width:20%');
        if (author.length == 1) {
            eA.appendChild(createItem(author.text(), author.attr('href')));
        }
        tr.appendChild(eA);
        let eC = document.createElement('td');
        eC.setAttribute('style', 'width:10%');
        if (cata.length == 1) {
            eC.appendChild(createItem(cata.text(), cata.attr('href')));
        }
        tr.appendChild(eC);
        let eTg = document.createElement('td');
        eTg.setAttribute('class', 'ALHS_PAL_PAGE_TAG');
        eTg.setAttribute('style', 'width:30%');
        tag.each(function() {
            eTg.appendChild(createItem($(this).text(), $(this).attr('href')));
        });
        tr.appendChild(eTg);
        table.appendChild(tr);
    });
    if ($('#main nav').length > 0) {
        let url = document.location.href;
        let mat;
        do {
            mat = /ailihaosi\.xyz\/$/.exec(url);
            if (mat) {
                curpage = 1;
                urlpat = 'https://ailihaosi.xyz/index.php/page/@/';
                break;
            }
            mat = /ailihaosi\.xyz\/index\.php\/page\/(\d+)\/$/.exec(url);
            if (mat) {
                curpage = Number(mat[1]);
                urlpat = 'https://ailihaosi.xyz/index.php/page/@/';
                break;
            }
            mat = /ailihaosi\.xyz\/index\.php\/archives\/([^/]+)\/([^/]+)\/$/.exec(url);
            if (mat) {
                curpage = Number(mat[2]);
                urlpat = 'https://ailihaosi.xyz/index.php/archives/' + mat[1] + '/@/';
                break;
            }
            curpage = null;
            break;
        } while (false);
        pageNv.setAttribute('style', 'display:flex');
        maxpage = Number($('.nav-links').find('.page-numbers').not('.next').last().text());

        for (let i = 1; i <= maxpage; ++i) {
            let a = document.createElement('a');
            if (i == curpage) {
                a.setAttribute('class', 'ALHS_PAL_NV_CUR');
            }
            a.innerText = String(i);
            a.setAttribute('href', urlpat.replace('@', String(i)));
            pageNv.appendChild(a);
        }
    }
    pageW.setAttribute('class', 'ALHS_PAL_PAGEW');
    page.setAttribute('id', 'ALHS_PAL_PAGE');
    pageNv.setAttribute('id', 'ALHS_PAL_PAGE_NV');
    pageW.appendChild(page);
    pageW.appendChild(pageNv);
    page.appendChild(table);
    popup.onmouseenter = () => {
        ++mousein;
        show(true);
    };
    popup.onmouseleave = () => {
        --mousein;
        if (mousein == 0) {
            prepareHide();
        }
    };
    pageW.onmouseenter = () => {
        ++mousein;
        pageW.focus();
    };
    pageW.onmouseleave = () => {
        --mousein;
        if (mousein == 0) {
            prepareHide();
        }
    }
    show(false);
    document.body.appendChild(popup);
    document.body.appendChild(pageW);
})();