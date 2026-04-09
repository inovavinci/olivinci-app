// ==========================================
// CÓDIGO DO GOOGLE APPS SCRIPT (BACKEND) - VERSÃO OTIMIZADA
// Copie e cole este código no editor de script da sua planilha
// ==========================================

function doGet(e) {
  try {
    var params = e.parameter;
    var unidade = params.unidade; // S, N, T
    var serie = params.serie;     // 1, 2, 3
    
    if (!unidade || !serie) {
      return responseJSON({ error: "Parâmetros unidade ou serie ausentes" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return responseJSON({ status: "error", message: "Não foi possível acessar a planilha ativa. Verifique se o script está vinculado à planilha." });
    }
    
    // 1. Obter Questões (Gabarito)
    var sheetGabName = "GAB" + serie;
    var sheetGab = ss.getSheetByName(sheetGabName);
    var questoes = [];
    
    if (sheetGab) {
      var dataGab = sheetGab.getDataRange().getValues();
      if (dataGab && dataGab.length > 0) {
        var headersGab = dataGab[0].map(function(h){ return String(h).toLowerCase().trim(); });
        
        var gabMap = {};
        headersGab.forEach(function(h, idx) {
          if (h.indexOf('numero') > -1 || h.indexOf('quest') > -1 || h === 'id') gabMap.numero = idx;
          else if (h.indexOf('componente') > -1 || h.indexOf('disciplina') > -1) gabMap.componente = idx;
          else if (h.indexOf('enunciado') > -1 || h.indexOf('pergunta') > -1) gabMap.enunciado = idx;
          else if (h.indexOf('imagem') > -1 || h.indexOf('img') > -1) gabMap.imagem = idx;
          else if (h.indexOf('resposta') > -1 || h.indexOf('gabarito') > -1 || h === 'c') gabMap.resposta = idx;
          else if (h.indexOf('item a') > -1 || h === 'a') gabMap.itemA = idx;
          else if (h.indexOf('item b') > -1 || h === 'b') gabMap.itemB = idx;
          else if (h.indexOf('item c') > -1 || h === 'c') gabMap.itemC = idx;
          else if (h.indexOf('item d') > -1 || h === 'd') gabMap.itemD = idx;
          else if (h.indexOf('item e') > -1 || h === 'e') gabMap.itemE = idx;
        });

        // Fallbacks
        if (gabMap.numero === undefined) gabMap.numero = 0;
        if (gabMap.componente === undefined) gabMap.componente = 1;
        if (gabMap.enunciado === undefined) gabMap.enunciado = 3;
        if (gabMap.imagem === undefined) gabMap.imagem = 4;
        if (gabMap.resposta === undefined) gabMap.resposta = 2;
        if (gabMap.itemA === undefined) gabMap.itemA = 5;
        if (gabMap.itemB === undefined) gabMap.itemB = 6;
        if (gabMap.itemC === undefined) gabMap.itemC = 7;
        if (gabMap.itemD === undefined) gabMap.itemD = 8;
        if (gabMap.itemE === undefined) gabMap.itemE = 9;

        for (var i = 1; i < dataGab.length; i++) {
          var row = dataGab[i];
          if (!row[0]) continue;
          questoes.push({
            numero: row[gabMap.numero],
            componente: row[gabMap.componente],
            enunciado: row[gabMap.enunciado],
            imagem: row[gabMap.imagem],
            resposta: row[gabMap.resposta],
            itemA: row[gabMap.itemA],
            itemB: row[gabMap.itemB],
            itemC: row[gabMap.itemC],
            itemD: row[gabMap.itemD],
            itemE: row[gabMap.itemE]
          });
        }
      }
    } else {
      return responseJSON({ status: "error", message: "Aba de gabarito não encontrada: " + sheetGabName });
    }

    // 2. Obter Equipes
    var sheetTeamName = unidade + serie;
    var sheetTeam = ss.getSheetByName(sheetTeamName);
    var equipes = [];
    
    if (sheetTeam) {
      var dataTeam = sheetTeam.getDataRange().getValues(); // getValues() é mais rápido que getDisplayValues()
      if (dataTeam && dataTeam.length > 0) {
        var headersTeam = dataTeam[0].map(function(h){ return String(h).toLowerCase().trim(); });
        var colMap = {};
        headersTeam.forEach(function(h, idx) { colMap[h] = idx; });

        for (var i = 1; i < dataTeam.length; i++) {
          var row = dataTeam[i];
          if (!row[0] && !row[1]) continue; 

          var teamObj = {};
          teamObj.equipe = row[colMap['equipe']] || row[colMap['nome']] || row[0];
          teamObj.chave = row[colMap['chave']] || row[colMap['codigo']] || row[colMap['id']] || row[1];
          
          for (var k = 1; k <= 20; k++) {
            var dKey = 'd' + k;
            if (colMap[dKey] !== undefined) teamObj[dKey] = row[colMap[dKey]];
          }
          equipes.push(teamObj);
        }
      }
    } else {
      return responseJSON({ status: "error", message: "Aba da turma não encontrada: " + sheetTeamName });
    }

    // 3. Obter Configurações (Timer)
    var timerDuration = "00:00:00";
    var sheetConfig = ss.getSheetByName("CONFIG");
    if (sheetConfig) {
      try {
        var val = sheetConfig.getRange("B1").getDisplayValue();
        if (val) timerDuration = val;
      } catch(configErr) {
        console.warn("Erro ao ler CONFIG:B1", configErr);
      }
    }
    
    var scriptProperties = PropertiesService.getScriptProperties();
    var lastReset = scriptProperties.getProperty('LAST_RESET_TIMESTAMP') || 0;

    return responseJSON({
      status: "success",
      questoes: questoes,
      equipes: equipes,
      lastReset: parseInt(lastReset),
      timerDuration: timerDuration
    });

  } catch (error) {
    return responseJSON({ status: "error", message: "Erro crítico no servidor: " + error.toString() });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === 'RESET') return handleReset(data);
    if (data.action === 'SAVE_TIME') return handleSaveTime(data);

    var unidade = data.unidade;
    var serie = data.serie;
    var equipeNome = data.equipe;
    var desafioKey = data.desafio; // d1, d2...
    var resultado = data.resultado; // CORRETO, ERRADO

    if (!unidade || !serie || !equipeNome || !desafioKey || !resultado) {
      throw new Error("Dados incompletos.");
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = unidade + serie;
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) throw new Error("Aba não encontrada: " + sheetName);

    var dataRange = sheet.getDataRange().getValues();
    var headers = dataRange[0].map(function(h){ return String(h).toLowerCase().trim(); });
    
    var colIndex = headers.indexOf(desafioKey.toLowerCase());
    if (colIndex === -1) throw new Error("Coluna do desafio não encontrada: " + desafioKey);

    var rowIndex = -1;
    for (var r = 1; r < dataRange.length; r++) {
      if (String(dataRange[r][0]).trim().toLowerCase() === String(equipeNome).trim().toLowerCase()) {
        rowIndex = r + 1;
        break;
      }
    }

    if (rowIndex === -1) throw new Error("Equipe não encontrada.");

    sheet.getRange(rowIndex, colIndex + 1).setValue(resultado);
    return responseJSON({ status: "success", message: "Resposta salva." });

  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

function handleSaveTime(data) {
  try {
    var unidade = data.unidade;
    var serie = data.serie;
    var equipeNome = data.equipe;
    var tempoRestante = data.tempo;

    if (!unidade || !serie || !equipeNome || !tempoRestante) throw new Error("Dados incompletos.");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(unidade + serie);
    if (!sheet) throw new Error("Aba não encontrada.");

    var dataRange = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var r = 1; r < dataRange.length; r++) {
      if (String(dataRange[r][0]).trim().toLowerCase() === String(equipeNome).trim().toLowerCase()) {
        rowIndex = r + 1;
        break;
      }
    }

    if (rowIndex === -1) throw new Error("Equipe não encontrada.");
    sheet.getRange(rowIndex, 28).setValue(tempoRestante); // Coluna AB
    return responseJSON({ status: "success" });
  } catch(e) {
    return responseJSON({ status: "error", message: e.toString() });
  }
}

function handleReset(data) {
  try {
    var unidade = data.unidade;
    var serie = data.serie;
    var password = data.password;

    if (password !== 'olivinci2024') throw new Error("Senha administrativa incorreta.");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetNames = unidade && serie ? [unidade + serie] : [];
    
    if (sheetNames.length === 0) {
      var sheets = ss.getSheets();
      sheets.forEach(function(s) {
        var name = s.getName();
        if (name.length <= 3 && (name.startsWith('S') || name.startsWith('N') || name.startsWith('T'))) {
          sheetNames.push(name);
        }
      });
    }

    sheetNames.forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (sheet) {
        var dataRange = sheet.getDataRange().getValues();
        var headers = dataRange[0].map(function(h){ return String(h).toLowerCase().trim(); });
        headers.forEach(function(h, idx) {
          if (h.startsWith('d') && h.length <= 3) {
            sheet.getRange(2, idx + 1, sheet.getLastRow(), 1).clearContent();
          }
        });
        // Limpar AB (Tempo)
        if (sheet.getLastRow() >= 2) {
          sheet.getRange(2, 28, sheet.getLastRow() - 1, 1).clearContent();
        }
      }
    });

    PropertiesService.getScriptProperties().setProperty('LAST_RESET_TIMESTAMP', Date.now().toString());
    return responseJSON({ status: "success", message: "Reset concluído." });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
