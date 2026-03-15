// ==========================================
// CÓDIGO DO GOOGLE APPS SCRIPT (BACKEND)
// Copie e cole este código no editor de script da sua planilha
// ==========================================

function doGet(e) {
  // Configurar CORS e Headers
  var output = ContentService.createTextOutput();
  
  try {
    var params = e.parameter;
    var unidade = params.unidade; // S, N, T
    var serie = params.serie;     // 1, 2, 3
    
    if (!unidade || !serie) {
      return responseJSON({ error: "Parâmetros unidade ou serie ausentes" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Obter Questões (Gabarito)
    // Abas esperadas: GAB1, GAB2, GAB3
    var sheetGabName = "GAB" + serie;
    var sheetGab = ss.getSheetByName(sheetGabName);
    var questoes = [];
    
    if (sheetGab) {
      var dataGab = sheetGab.getDataRange().getValues();
      var headersGab = dataGab[0].map(function(h){ return String(h).toLowerCase().trim(); });
      
      // Mapeamento dinâmico de colunas do Gabarito
      var gabMap = {};
      headersGab.forEach(function(h, idx) {
        // Tenta identificar colunas por palavras-chave comuns
        if (h.indexOf('numero') > -1 || h.indexOf('quest') > -1 || h === 'id') gabMap.numero = idx;
        else if (h.indexOf('componente') > -1 || h.indexOf('disciplina') > -1) gabMap.componente = idx;
        else if (h.indexOf('enunciado') > -1 || h.indexOf('pergunta') > -1) gabMap.enunciado = idx;
        else if (h.indexOf('imagem') > -1 || h.indexOf('img') > -1) gabMap.imagem = idx;
        else if (h.indexOf('resposta') > -1 || h.indexOf('gabarito') > -1 || h === 'c') gabMap.resposta = idx;
      });

      // Fallback para índices padrão se não encontrar headers (A=0, B=1, C=2...)
      // Assumindo estrutura do usuário: Resposta na C (idx 2)
      if (gabMap.numero === undefined) gabMap.numero = 0;
      if (gabMap.componente === undefined) gabMap.componente = 1;
      if (gabMap.enunciado === undefined) gabMap.enunciado = 3; // Ajuste conforme necessário
      if (gabMap.imagem === undefined) gabMap.imagem = 4;
      if (gabMap.resposta === undefined) gabMap.resposta = 2; // Coluna C é 2 (0-based)

      for (var i = 1; i < dataGab.length; i++) {
        var row = dataGab[i];
        if (!row[0]) continue; // Pular linhas vazias

        var q = {};
        q.numero = row[gabMap.numero]; 
        q.componente = row[gabMap.componente];
        q.enunciado = row[gabMap.enunciado];
        q.imagem = row[gabMap.imagem];
        q.resposta = row[gabMap.resposta]; // Garante pegar da coluna mapeada
        
        // Debug: Logar se resposta estiver vazia
        if (q.resposta === undefined || q.resposta === "") {
           q.debug_aviso = "Resposta vazia na linha " + (i+1);
        }
        
        questoes.push(q);
      }
    }

    // 2. Obter Equipes
    // Abas esperadas: S1, S2, S3, N1... (Unidade + Serie)
    var sheetTeamName = unidade + serie; // Ex: S3
    var sheetTeam = ss.getSheetByName(sheetTeamName);
    var equipes = [];
    
    if (sheetTeam) {
      var dataTeam = sheetTeam.getDataRange().getDisplayValues(); // getDisplayValues para pegar texto exato
      var headersTeam = dataTeam[0];
      
      // Mapear cabeçalhos para índices (d1, d2... chave, equipe)
      var colMap = {};
      headersTeam.forEach(function(h, idx) {
        var key = String(h).toLowerCase().trim();
        colMap[key] = idx;
      });

      for (var i = 1; i < dataTeam.length; i++) {
        var row = dataTeam[i];
        // Validar se linha tem dados
        if (!row[0] && !row[1]) continue; 

        var teamObj = {};
        
        // Campos fixos essenciais
        // Tenta achar 'equipe' ou 'nome' ou coluna A (0)
        teamObj.equipe = row[colMap['equipe']] || row[colMap['nome']] || row[0];
        
        // Tenta achar 'chave' ou 'codigo' ou coluna B (1)
        teamObj.chave = row[colMap['chave']] || row[colMap['codigo']] || row[colMap['id']] || row[1];
        
        // Campos dinâmicos (d1 a d24)
        for (var k = 1; k <= 24; k++) {
          var dKey = 'd' + k;
          if (colMap[dKey] !== undefined) {
            teamObj[dKey] = row[colMap[dKey]];
          }
        }
        
        equipes.push(teamObj);
      }
    }

    // Obter timestamp do último reset global/parcial
    var scriptProperties = PropertiesService.getScriptProperties();
    var lastReset = scriptProperties.getProperty('LAST_RESET_TIMESTAMP') || 0;

    return responseJSON({
      status: "success",
      questoes: questoes,
      equipes: equipes,
      lastReset: parseInt(lastReset)
    });

  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  // LockService impede conflitos de gravação simultânea
  var lock = LockService.getScriptLock();
  try {
    // Tenta obter bloqueio por até 10 segundos
    lock.waitLock(10000); 
  } catch (e) {
    return responseJSON({ status: "error", message: "Servidor ocupado, tente novamente." });
  }

  try {
    // Ler dados do corpo
    var postData = e.postData.contents;
    var data = JSON.parse(postData);
    
    // VERIFICAR SE É UMA AÇÃO DE RESET
    if (data.action === 'RESET') {
      return handleReset(data);
    }

    var unidade = data.unidade;
    var serie = data.serie;
    var equipeNome = data.equipe;
    var chave = data.chave;
    var desafioCol = data.desafio; // d1, d2...
    var resultado = data.resultado; // CORRETO, ERRADO, BRANCO

    if (!unidade || !serie || !equipeNome || !desafioCol) {
      throw new Error("Dados incompletos para gravação.");
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = unidade + serie; // Ex: S3
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error("Aba não encontrada: " + sheetName);
    }

    // Localizar a linha da equipe e a coluna do desafio
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var dataRange = sheet.getDataRange().getValues();
    
    // 1. Achar índice da coluna do desafio (d1, d2...)
    var colIndex = -1;
    for (var c = 0; c < headers.length; c++) {
      if (String(headers[c]).toLowerCase().trim() === String(desafioCol).toLowerCase().trim()) {
        colIndex = c + 1; // 1-based para getRange
        break;
      }
    }
    
    if (colIndex === -1) throw new Error("Coluna do desafio não encontrada: " + desafioCol);

    // 2. Achar índice da linha da equipe
    var rowIndex = -1;
    // Procurar por Chave (mais seguro) ou Nome
    for (var r = 1; r < dataRange.length; r++) {
      var row = dataRange[r];
      var rowEquipe = String(row[0]).trim().toLowerCase(); // Coluna A
      var rowChave = String(row[1]).trim(); // Coluna B
      
      var inputEquipe = String(equipeNome).trim().toLowerCase();
      var inputChave = String(chave).trim();

      // Prioridade: Chave bate? OU Nome bate?
      if ((inputChave && rowChave === inputChave) || (rowEquipe === inputEquipe)) {
        rowIndex = r + 1; // 1-based
        break;
      }
    }

    if (rowIndex === -1) throw new Error("Equipe não encontrada: " + equipeNome);

    // 3. Gravar
    sheet.getRange(rowIndex, colIndex).setValue(resultado);
    
    return responseJSON({ status: "success", message: "Dados salvos", data: data });

  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Função específica para lidar com RESET
function handleReset(data) {
  // Senha hardcoded (idealmente estaria em PropertiesService, mas hardcoded é ok para uso simples)
  var ADMIN_SECRET = 'OLIVINCI_ADMIN_2026'; 
  
  if (data.password !== ADMIN_SECRET) {
    throw new Error("Senha administrativa incorreta.");
  }

  var unidade = data.unidade; // Pode ser 'ALL'
  var serie = data.serie;     // Pode ser ignorado se unidade for ALL
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsToReset = [];

  if (unidade === 'ALL') {
    // Lista de todas as abas de equipe conhecidas
    var allSheets = ['S1', 'S2', 'S3', 'N1', 'N2', 'N3', 'T1', 'T2', 'T3'];
    sheetsToReset = allSheets;
  } else {
    if (!unidade || !serie) {
      throw new Error("Unidade e Série são obrigatórios para reset parcial.");
    }
    sheetsToReset.push(unidade + serie);
  }

  var logMsg = "Reset iniciado por Admin. Alvos: " + sheetsToReset.join(", ");
  logAction(ss, logMsg);

  var results = [];

  sheetsToReset.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      results.push(sheetName + ": Não encontrada (ignorada)");
      return;
    }

    // Identificar onde começam as colunas de dados (d1...)
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var startColIndex = -1;
    var endColIndex = -1;

    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c]).toLowerCase().trim();
      if (h === 'd1') startColIndex = c + 1;
      if (h.startsWith('d') && !isNaN(parseInt(h.substring(1)))) {
         endColIndex = c + 1;
      }
    }

    if (startColIndex === -1) {
      // Se não achou d1, tenta limpar da coluna 3 (C) em diante
      startColIndex = 3; 
      endColIndex = sheet.getLastColumn();
    }

    // Limpar conteúdo das respostas (mantendo cabeçalhos e colunas A/B)
    var numRows = sheet.getLastRow() - 1; // Exclui header
    if (numRows > 0) {
      sheet.getRange(2, startColIndex, numRows, (endColIndex - startColIndex + 1))
           .clearContent();
      results.push(sheetName + ": Resetado");
    } else {
      results.push(sheetName + ": Vazia (nada a limpar)");
    }
  });

  // Atualizar Timestamp de Reset Global
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('LAST_RESET_TIMESTAMP', String(Date.now()));

  return responseJSON({ 
    status: "success", 
    message: "Reset concluído.", 
    details: results 
  });
}

function logAction(ss, message) {
  var logSheet = ss.getSheetByName("_LOGS");
  if (!logSheet) {
    logSheet = ss.insertSheet("_LOGS");
    logSheet.appendRow(["Timestamp", "Mensagem"]);
  }
  logSheet.appendRow([new Date(), message]);
}

// Helper para retornar JSON corretamente
function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
