// ==UserScript==
// @name         艾利浩斯图书馆浏览所有章节
// @namespace    https://ailihaosi.xyz/
// @version      0.1.3
// @description  在含有多个章节的文章中自动加载其他章节并合并到同一页进行浏览
// @author       nekosu
// @include      https://ailihaosi.xyz/index.php/archives/*/*/*/
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	if (!/https:\/\/ailihaosi\.xyz\/index\.php\/archives\/\d{4}\/\d{2}\/\d+/.exec(document.location.href)) {
		return;
	}
	let menu = $('ul.post-series-list');
	if (menu.length == 0) {
		return;
	}
	let nav = $('#site-navigation');
	if (nav.length == 0) {
		nav = $('#sticky-navigation');
	}
	let theme = nav.css('background-color');
    let style = document.createElement('style');
    style.innerText = `
.ALHS_CA_BTN {
	margin: 0px 0px 20px 50px;
	background: ${theme} !important;
	cursor: url(http://wosn.net/zhizhen/normal.cur),default !important;
}
`;
    document.body.appendChild(style);
	let current = 0;
	let data = [];

	function createList(cur) {
		let sec = document.createElement('section');
		let ul = document.createElement('ul');
		for (let i = 0; i < data.length; ++i) {
			let li = document.createElement('li');
			let sp = document.createElement('span');
			let a = document.createElement('a');
			a.setAttribute('href', '#ALHS_CA_ANCHOR_' + i);
			a.innerText = data[i].entry;
			if (i == cur) {
				a.setAttribute('style', 'font-weight:bold');
			}
			sp.appendChild(a);
			li.appendChild(sp);
			ul.appendChild(li);
		}
		sec.appendChild(ul);
		return sec;
	}
	let series = $('strong.post-series-title a').text();
	menu.children().each(function() {
		let span = $(this).children();
		let a = span.children();
		let text;
		let obj = {};
		if (a.length == 0) {
			text = span.text();
			obj.current = true;
			obj.link = '';
		} else {
			text = a.text();
			obj.link = a.attr('href');
		}
		// Remove 《》
		text = text.replace(/《([\d\D]*)》/g, '$1');
		// Remove useless header
		let mt = 0;
		for (let i = 0; i < series.length; ++i) {
			if (text[i] == series[i]) {
				++mt;
			}
		}
		if (mt > 0.75 || series.length - mt <= 1) {
			text = text.substr(series.length);
		}
		text = text.replace(/^[ -]*/, '');
		function doMatch(t, subkeys) {
			let re = new RegExp(`[第（〈]* *([零一二三四五六七八九十百千万0-9]+(?:-[零一二三四五六七八九十百千万0-9]+)?(?:、\+[零一二三四五六七八九十百千万0-9]+)*) *[${subkeys}〉）]*`);
			let mat = re.exec(t);
			let h = null, n = null, r = null, b = 0;
			if (!mat) {
				if (t.length > 0) {
					h = t;
				}
			} else {
				if (mat.index != 0) {
					h = t.substr(0, mat.index);
				}
				n = mat[1] || mat[2];
				r = t.substr(mat.index + mat[0].length);
			}
			if (h) {
				h = h.replace(/^[ \-，]*/, '').replace(/[ \-，]*$/, '').replace(/^（(.*)）$/, '$1');
			}
			if (n) {
				function trans(s) {
					let idx = '零一二三四五六七八九';
					let res = 0;
					if (/[零一二三四五六七八九十百千万]/.exec(s)) {
						let mat;
						mat = /([一二三四五六七八九])万/.exec(s);
						if (mat) {
							res += 10000 * idx.indexOf(mat[1]);
						}
						mat = /([一二三四五六七八九])千/.exec(s);
						if (mat) {
							res += 1000 * idx.indexOf(mat[1]);
						}
						mat = /([一二三四五六七八九])百/.exec(s);
						if (mat) {
							res += 100 * idx.indexOf(mat[1]);
						}
						mat = /([一二三四五六七八九])十/.exec(s);
						if (mat) {
							res += 10 * idx.indexOf(mat[1]);
						}
						mat = /^十/.exec(s);
						if (mat) {
							res += 10;
						}
						mat = /([一二三四五六七八九])$/.exec(s);
						if (mat) {
							res += idx.indexOf(mat[1]);
						}
						return res;
					} else {
						return Number(s);
					}
				}
				let rs = n.split(/[、+]/);
				let res = '';
				if (rs.length > 1) {
					let nn = [];
					rs.forEach(s => {
						nn.push(trans(s));
					});
					nn.sort((a, b) => { return a < b; });
					let cansp = true;
					for (let i = 1; i < nn.length; ++i) {
						if (nn[i - 1] + 1 != nn[i]) {
							cansp = false;
						}
					}
					b = nn[0];
					if (cansp) {
						res = b + '~' + nn[nn.length - 1];
					} else {
						res = nn.join(',');
					}
				} else {
					rs = n.split('-');
					if (rs.length > 1) {
						b = trans(rs[0]);
						res = b + '~' + trans(rs[1]);
					} else {
						b = trans(n);
						res = String(b);
					}
				}
				n = res;
			}
			if (r) {
				r = r.replace(/^[ \-，]*/, '');
			}
			return {
				h: h, n: n, r: r, b: b
			};
		}
		let h0 = null, n1 = null, b1 = null, h1 = null, n2 = null, b2 = null, h2 = null;
		let mat;
		mat = doMatch(text, '章张');
		h0 = mat.h;
		n1 = mat.n;
		b1 = mat.b;
		text = mat.r;
		if (text && text.length > 0) {
			mat = doMatch(text, '节');
			h1 = mat.h;
			n2 = mat.n;
			b2 = mat.b;
			h2 = mat.r;
		}
		let res = '';
		if (h0) {
			res += h0 + ' ';
		}
		if (n1) {
			res += 'C' + n1 + ' ';
		}
		if (h1) {
			res += h1 + ' ';
		}
		if (n2) {
			res += 'S' + n2 + ' ';
		}
		if (h2) {
			res += h2 + ' ';
		}
		obj.title = [ h0, b1, h1, b2, h2 ];
		obj.entry = res;
		data.push(obj);
	});
	function sortTitle(s1, s2) {
		if (s1 == s2) {
			return 0;
		}
		function calcPr(s) {
			if (/序/.exec(s)) {
				return 2;
			}
			if (/楔/.exec(s)) {
				return 1;
			}
			if (s) {
				return -1;
			} else {
				return 0;
			}
		}
		let pr1 = calcPr(s1), pr2 = calcPr(s2);
		if (pr1 == pr2) {
			return s1.localeCompare(s2);
		} else {
			return pr2 - pr1;
		}
	};
	data.sort((a, b) => {
		let t;
		t = sortTitle(a.title[0], b.title[0]);
		if (t != 0) {
			return t;
		}
		t = a.title[1] - b.title[1];
		if (t != 0) {
			return t;
		}
		t = a.title[3] - b.title[3];
		return t;
	});
	for (let i = 0; i < data.length; ++i) {
		if (data[i].current) {
			current = i;
		}
	}
	$('h1.entry-title').text(series);
	for (let i = current; i >= 0; --i) {
		$('<a id="ALHS_CA_A_' + i + '" name="ALHS_CA_ANCHOR_' + i + '" />').insertAfter('section.post-series');
	}
	for (let i = current + 1; i < data.length; ++i) {
		$('<a id="ALHS_CA_A_' + i + '" name="ALHS_CA_ANCHOR_' + i + '" />').insertBefore('#related_posts');
	}
	let retries = [];
	for (let i = 0; i < data.length; ++i) {
		$(createList(i)).insertAfter('#ALHS_CA_A_' + i);
		if (i != 0) {
			$('<hr />').insertBefore('#ALHS_CA_A_' + i);
		}
		if (i != current) {
			retries.push((function(page) {
				let loading = false;
				let btn = document.createElement('input');
				btn.setAttribute('class', 'ALHS_CA_BTN');
				btn.setAttribute('type', 'button');
				btn.setAttribute('id', 'ALHS_CA_BTN_' + page);
				$(btn).insertAfter($('#ALHS_CA_A_' + page).next());
				function setLoading() {
					btn.setAttribute('disabled', 'disabled');
					btn.setAttribute('value', '加载中...');
				}
				function setReload() {
					btn.setAttribute('value', '刷新');
				}
				setReload();
				let retry = function() {
					if (loading) {
						return;
					}
					loading = true;
					setLoading();
					$.ajax({
						url: data[page].link,
						type: 'GET',
						dataType: 'html',
						error: function() {
							btn.setAttribute('value', '刷新');
							loading = false;
						},
						success: function(result) {
							btn.remove();
							let obj = $('<code></code>').append($(result));
							let dat = $('div.entry-content', obj);
							dat.children().slice(3, -2).insertAfter($('#ALHS_CA_A_' + page).next());
							retries[page] = () => {};
						}
					});
				};
				btn.onclick = retry;
				return retry;
				// retry();
			})(i));
		} else {
			retries.push(() => {});
		}
	}
	$('section.post-series').css('display', 'none');
	$('#related_posts').css('display', 'none');
	$('#related_posts').next().css('display', 'none');
	function updateAround() {
		let left = Math.max(0, current - 5);
		let right = Math.min(data.length - 1, current + 5);
		for (let i = left; i <= right; ++i) {
			retries[i]();
		}
	}
	if (data.length < 10) {
		for (let i = 0; i < data.length; ++i) {
			retries[i]();
		}
	} else {
		updateAround();
		window.onhashchange = function() {
			let mat = /^#ALHS_CA_ANCHOR_(\d+)$/.exec(window.location.hash);
			if (mat) {
				current = Number(mat[1]);
				updateAround();
			}
		}
	}
	window.location.hash = 'ALHS_CA_ANCHOR_' + current;
})();