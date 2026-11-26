/* PANDORA TOOLS 테마 전환
   밝게 → 어둡게 → 기기 설정 순서로 돌아가며, 고른 값은 이 브라우저에 저장된다.
   head에서 바로 실행되어야 화면이 한 번 깜빡였다가 바뀌는 현상이 없다. */
(function () {
    'use strict';

    var KEY = 'pt-theme';
    var ORDER = ['light', 'dark', 'system'];
    var LABEL = { light: '밝게', dark: '어둡게', system: '기기 설정에 맞춤' };

    function saved() {
        try {
            var v = localStorage.getItem(KEY);
            return (v === 'light' || v === 'dark') ? v : 'system';
        } catch (e) {
            return 'system';
        }
    }

    function apply(mode) {
        var root = document.documentElement;
        if (mode === 'system') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', mode);
        }
    }

    // 1단계: 화면이 그려지기 전에 테마부터 적용한다
    apply(saved());

    // 2단계: 문서가 준비되면 버튼을 붙인다
    function build() {
        if (document.querySelector('.pt-theme-toggle')) { return; }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pt-theme-toggle';
        btn.innerHTML =
            // 해 (밝게)
            '<svg class="i-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.4M12 19.2v2.4M4.2 12H1.8M22.2 12h-2.4' +
            'M6.5 6.5 4.8 4.8M19.2 19.2l-1.7-1.7M17.5 6.5l1.7-1.7M4.8 19.2l1.7-1.7"/></svg>' +
            // 달 (어둡게)
            '<svg class="i-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M20.5 14.3A8.6 8.6 0 1 1 9.7 3.5a6.9 6.9 0 0 0 10.8 10.8z"/></svg>' +
            // 모니터 (기기 설정)
            '<svg class="i-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<rect x="2.6" y="3.6" width="18.8" height="13" rx="2"/><path d="M8.4 20.4h7.2M12 16.6v3.8"/></svg>';

        function paint(mode) {
            ['light', 'dark', 'system'].forEach(function (m) {
                var el = btn.querySelector('.i-' + m);
                if (el) { el.classList.toggle('on', m === mode); }
            });
            var next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
            btn.setAttribute('aria-label', '화면 테마: ' + LABEL[mode] + '. 누르면 ' + LABEL[next] + '(으)로 바뀝니다');
            btn.setAttribute('title', '화면 테마: ' + LABEL[mode]);
        }

        btn.addEventListener('click', function () {
            var cur = saved();
            var next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
            try {
                if (next === 'system') { localStorage.removeItem(KEY); }
                else { localStorage.setItem(KEY, next); }
            } catch (e) { /* 저장이 막혀 있어도 이번 화면에는 적용된다 */ }
            apply(next);
            paint(next);
        });

        paint(saved());
        document.body.appendChild(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
