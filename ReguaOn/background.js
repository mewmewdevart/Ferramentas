chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    const outlineClassName = 'regua-on-active';
    const outlineCSS = `
        /* Aplica contornos a todos os elementos quando a classe 'regua-on-active' está presente no corpo */
        body.${outlineClassName} * {
            outline: 1px solid rgba(255, 0, 0, 0.5) !important; /* Contorno vermelho com transparência */
            box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3) !important; /* Sombra interna verde para visibilidade */
            background-color: rgba(255, 255, 0, 0.05) !important; /* Leve tonalidade amarela para o fundo */
            z-index: 999999 !important; /* Garante que os contornos estejam no topo de outros elementos */
        }

        /* Exclui o contorno do próprio corpo para evitar contornos duplos ou indesejados no body */
        body.${outlineClassName} {
            outline: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
        }

        /* Opcional: Adiciona algumas cores únicas para diferentes tipos de elementos para melhor depuração */
        body.${outlineClassName} div { outline-color: rgba(255, 0, 0, 0.7) !important; } /* Divs em vermelho */
        body.${outlineClassName} span { outline-color: rgba(0, 0, 255, 0.7) !important; } /* Spans em azul */
        body.${outlineClassName} p { outline-color: rgba(255, 165, 0, 0.7) !important; } /* Parágrafos em laranja */
        body.${outlineClassName} a { outline-color: rgba(128, 0, 128, 0.7) !important; } /* Links em roxo */
        body.${outlineClassName} img { outline-color: rgba(0, 128, 0, 0.7) !important; } /* Imagens em verde */
        body.${outlineClassName} button { outline-color: rgba(255, 99, 71, 0.7) !important; } /* Botões em vermelho tomate */
        body.${outlineClassName} input { outline-color: rgba(70, 130, 180, 0.7) !important; } /* Inputs em azul aço */
        body.${outlineClassName} ul, body.${outlineClassName} ol { outline-color: rgba(218, 112, 214, 0.7) !important; } /* Listas em roxo orquídea */
        body.${outlineClassName} li { outline-color: rgba(60, 179, 113, 0.7) !important; } /* Itens de lista em verde mar médio */
        body.${outlineClassName} table { outline-color: rgba(178, 34, 34, 0.7) !important; } /* Tabelas em vermelho fogo */
        body.${outlineClassName} th, body.${outlineClassName} td { outline-color: rgba(255, 215, 0, 0.7) !important; } /* Células de tabela em dourado */

        /* Garante que as propriedades importantes (outline, box-shadow, background-color) substituam quaisquer estilos existentes no elemento */
        [style*="outline"], [style*="box-shadow"], [style*="background-color"] {
            outline: 1px solid rgba(255, 0, 0, 0.5) !important;
            box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3) !important;
            background-color: rgba(255, 255, 0, 0.05) !important;
        }
    `;

    // Conteúdo do script que será injetado na página (para adicionar/remover a classe)
    const contentScriptFunction = (className) => {
        if (document.body.classList.contains(className)) {
            document.body.classList.remove(className);
        } else {
            document.body.classList.add(className);
        }
    };

    // Função para aplicar/remover os contornos na aba
    const applyOutlinesToTab = async (tabId, isActive) => {
        try {
            if (isActive) {
                // Injeta o script para adicionar a classe 'regua-on-active'
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: contentScriptFunction,
                    args: [outlineClassName]
                });
                // Injeta o CSS
                await chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    css: outlineCSS
                });
            } else {
                // Injeta o script para remover a classe 'regua-on-active'
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: contentScriptFunction,
                    args: [outlineClassName]
                });
                // Remove o CSS (se já estiver injetado)
                await chrome.scripting.removeCSS({
                    target: { tabId: tabId },
                    css: outlineCSS
                });
            }
        } catch (error) {
            // Ignora erros se a aba não estiver mais disponível (ex: fechada)
            if (error.message.includes("No tab with id")) {
                console.warn(`Aba ${tabId} não encontrada, ignorando injeção/remoção de CSS.`);
            } else {
                console.error(`Erro ao aplicar/remover contornos na aba ${tabId}:`, error);
            }
        }
    };

    if (request.action === "toggleOutlines") {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
            const activeTab = tabs[0];
            const result = await chrome.storage.local.get('isOutlinesActive');
            const newOutlinesState = !result.isOutlinesActive; 

            await chrome.storage.local.set({ isOutlinesActive: newOutlinesState });

            await applyOutlinesToTab(activeTab.id, newOutlinesState);
        }
    }
});

// Listener para reaplicar contornos quando uma aba é atualizada ou navegada
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        try {
            const result = await chrome.storage.local.get('isOutlinesActive');
            const isOutlinesActive = result.isOutlinesActive || false;
            if (isOutlinesActive) {
                const outlineClassName = 'regua-on-active';
                const outlineCSS = `
                    body.${outlineClassName} * { outline: 1px solid rgba(255, 0, 0, 0.5) !important; box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3) !important; background-color: rgba(255, 255, 0, 0.05) !important; z-index: 999999 !important; }
                    body.${outlineClassName} { outline: none !important; box-shadow: none !important; background-color: transparent !important; }
                    body.${outlineClassName} div { outline-color: rgba(255, 0, 0, 0.7) !important; }
                    body.${outlineClassName} span { outline-color: rgba(0, 0, 255, 0.7) !important; }
                    body.${outlineClassName} p { outline-color: rgba(255, 165, 0, 0.7) !important; }
                    body.${outlineClassName} a { outline-color: rgba(128, 0, 128, 0.7) !important; }
                    body.${outlineClassName} img { outline-color: rgba(0, 128, 0, 0.7) !important; }
                    body.${outlineClassName} button { outline-color: rgba(255, 99, 71, 0.7) !important; }
                    body.${outlineClassName} input { outline-color: rgba(70, 130, 180, 0.7) !important; }
                    body.${outlineClassName} ul, body.${outlineClassName} ol { outline-color: rgba(218, 112, 214, 0.7) !important; }
                    body.${outlineClassName} li { outline-color: rgba(60, 179, 113, 0.7) !important; }
                    body.${outlineClassName} table { outline-color: rgba(178, 34, 34, 0.7) !important; }
                    body.${outlineClassName} th, body.${outlineClassName} td { outline-color: rgba(255, 215, 0, 0.7) !important; }
                    [style*="outline"], [style*="box-shadow"], [style*="background-color"] { outline: 1px solid rgba(255, 0, 0, 0.5) !important; box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3) !important; background-color: rgba(255, 255, 0, 0.05) !important; }
                `;
                const contentScriptFunction = (className) => {
                    document.body.classList.add(className);
                };

                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: contentScriptFunction,
                    args: [outlineClassName]
                });
                await chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    css: outlineCSS
                });
            }
        } catch (error) {
            console.error(`Erro ao reaplicar contornos na aba ${tabId}:`, error);
        }
    }
});