const VOIP = require('./index');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Configuração SIP
const sipConfig = {
  username: process.env.SIP_USERNAME || '551129496601',
  password: process.env.SIP_PASSWORD || 'y4f7ptzwab',
  server: process.env.SIP_URI || 'apolo.inside.com.br',
  port: process.env.SIP_PORT || 5060,
  displayName: process.env.SIP_DISPLAY_NAME || 'Agente n8n'
};

// Inicializa o cliente SIP
const voipClient = new VOIP({
  type: 'client',
  transport: {
    type: 'udp4',
    port: 5061, // Porta local alternativa
    ip: '0.0.0.0'
  },
  username: sipConfig.username,
  register_ip: sipConfig.server,
  register_port: sipConfig.port,
  register_password: sipConfig.password
}, (status) => {
  console.log('Status SIP:', status);
});

// Endpoint para n8n fazer chamadas
app.post('/make-call', (req, res) => {
  const { number } = req.body;
  
  if (!number) {
    return res.status(400).json({ error: 'Número é obrigatório' });
  }

  try {
    voipClient.uac_init_call({
      username: sipConfig.username,
      to: number,
      ip: sipConfig.server,
      port: sipConfig.port,
      branch: VOIP.Builder.generateBranch(),
      from_tag: VOIP.Builder.generateTag(),
      callId: `${Math.random().toString(36).substring(2, 15)}@${sipConfig.server}`,
      client_callback: (response) => {
        console.log('Resposta da chamada:', response);
      }
    });
    
    res.json({ status: 'Chamando', number });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});