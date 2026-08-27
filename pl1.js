(function () {
    'use strict';

    if (window.plugin_ukr_sources_unified_ready) return;
    window.plugin_ukr_sources_unified_ready = true;

    // 1. Стилі для повноекранного iframe-плеєра
    var style = document.createElement('style');
    style.innerHTML = `
        .ukr-pl-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .ukr-pl-overlay iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    `;
    document.head.appendChild(style);

    // Список зовнішніх джерел
    var externalSources = [
        { title: 'КіноУкр',     url: 'https://kinoukr.tv/' },
        { title: 'Енеїда',      url: 'https://eneyida.tv/' },
        { title: 'UA Серіал',   url: 'https://uaserial.tv/' },
        { title: 'Rezka',       url: 'https://rezka.ag/' },
        { title: 'Filmix',      url: 'https://filmix.my/' },
        { title: 'Толока',      url: 'https://toloka.to/' },
        { title: 'AniLiberty',  url: 'https://aniliberty.top/' }
    ];

    /**
     * Відкриття посилання у браузері пристрою
     */
    function openUrl(url) {
        if (window.Lampa && Lampa.Platform && Lampa.Platform.open) {
            Lampa.Platform.open(url);
        } else {
            window.open(url, '_blank');
        }
    }

    /**
     * Повноекранний Iframe Плеєр із захистом від перезавантаження сторінки
     */
    function openIframePlayer(url, title) {
        $('.ukr-pl-overlay').remove();

        var playerHtml = $(`
            <div class="ukr-pl-overlay">
                <iframe src="${url}" 
                        allow="autoplay; fullscreen; encrypted-media" 
                        allowfullscreen="true" 
                        webkitallowfullscreen="true" 
                        mozallowfullscreen="true">
                </iframe>
            </div>
        `);

        $('body').append(playerHtml);

        var prevController = Lampa.Controller.enabled().name;

        // Перехоплення кнопки "Назад" пульта Smart TV
        Lampa.Controller.add('ukr_pl_player_controller', {
            toggle: function () {},
            back: function () {
                playerHtml.remove();
                Lampa.Controller.toggle(prevController || 'content');
            }
        });

        Lampa.Controller.toggle('ukr_pl_player_controller');
    }

    /**
     * Маршрутизатор відеопотоків
     */
    function playStream(streamUrl, title) {
        if (streamUrl.indexOf('.m3u8') !== -1 || streamUrl.indexOf('.mp4') !== -1) {
            var item = {
                url: streamUrl,
                title: title || 'Українське джерело'
            };
            Lampa.Player.play(item);
            Lampa.Player.playlist([item]);
        } else {
            openIframePlayer(streamUrl, title);
        }
    }

    /**
     * Меню вибору плеєрів
     */
    function showSourceSelect(card) {
        var title = card.title || card.name;
        var year = (card.release_date || card.first_air_date || '').substring(0, 4);

        Lampa.Select.show({
            title: 'Джерела: ' + title,
            items: [
                {
                    title: 'Український плеєр (Iframe)',
                    subtitle: title + ' (' + year + ')',
                    url: 'https://piwas84.github.io/sors/embed?title=' + encodeURIComponent(title)
                },
                {
                    title: 'Прямий HLS потік (.m3u8)',
                    subtitle: 'Нативний плеєр Lampa',
                    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
                }
            ],
            onSelect: function (item) {
                playStream(item.url, title);
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    /**
     * Меню зовнішніх ресурсів
     */
    function showExternalSources() {
        var items = externalSources.map(function (s) {
            return {
                title: s.title,
                url: s.url
            };
        });

        Lampa.Select.show({
            title: 'Інше — Українські джерела',
            items: items,
            onSelect: function (a) {
                openUrl(a.url);
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    /**
     * Додавання кнопок у картку фільму / серіалу
     */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var render = e.object.activity.render();
        var card = e.object.method;
        var container = render.find('.full-start__buttons, .buttons--container');

        if (!render || !render.length || !container.length) return;

        // 1. Кнопка плеєрів (Ukr Sources + PL)
        if (!render.find('.button--ukr-sources-pl').length) {
            var btnPlayer = $(`
                <div class="full-start__button selector button--ukr-sources-pl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>Ukr Sources + PL</span>
                </div>
            `);

            btnPlayer.on('hover:enter', function () {
                showSourceSelect(card);
            });

            container.append(btnPlayer);
        }

        // 2. Кнопка сайтів (Інше UA)
        if (!render.find('.view--ukr-sources').length) {
            var btnExt = $(`
                <div class="full-start__button selector view--ukr-sources">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
                    </svg>
                    <span>Інше (UA)</span>
                </div>
            `);

            btnExt.on('hover:enter', function () {
                showExternalSources();
            });

            container.append(btnExt);
        }
    });

    console.log('Plugin Ukr Sources Unified: Fully loaded');
})();
