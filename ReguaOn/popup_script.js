document.addEventListener('DOMContentLoaded', async () => {
    const toggleButton = document.getElementById('toggleButton');
    const outlineClassName = 'regua-on-active';

    const updateButtonText = (isActive) => {
        toggleButton.textContent = isActive ? 'Desativar Contornos' : 'Ativar Contornos';
    };

    try {
        const result = await chrome.storage.local.get('isOutlinesActive');
        const isCurrentlyActive = result.isOutlinesActive || false;
        updateButtonText(isCurrentlyActive);
    } catch (error) {
        console.error("Erro ao carregar estado do armazenamento:", error);
        updateButtonText(false);
    }

    toggleButton.addEventListener('click', () => {
        // Envia uma mensagem para o script de fundo (background.js) para alternar os contornos
        chrome.runtime.sendMessage({ action: "toggleOutlines" });
        window.close();
    });

    // Opcional: Ouve mudanças no armazenamento para atualizar o botão em tempo real
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.isOutlinesActive) {
            updateButtonText(changes.isOutlinesActive.newValue);
        }
    });
});