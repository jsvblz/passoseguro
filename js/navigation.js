/**
 * ============================================================================
 * PASSO SEGURO · MOTOR DE NAVEGAÇÃO PASSO A PASSO E PATHFINDING BFS EM GRID
 * - Constrói a malha navegável (walkable grid 16x12) com paredes, gôndolas e obstáculos
 * - Algoritmo BFS (Breadth-First Search) para rota mínima entre (x1,y1) e (x2,y2)
 * - Roteirizador Multi-Paradas (Nearest-Neighbor TSP) para a Lista de Compras
 * - Gerador de Instruções Relativas ao Corpo do Usuário (graus, passos e prateleira)
 * ============================================================================
 */

window.NavigationEngine = {
  /**
   * Constrói a matriz 2D [y][x] do ambiente ativo levando em conta obstáculos dinâmicos
   */
  buildGrid(env, obstacles = []) {
    const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(CELL.FREE));

    // Paredes perimetrais externas
    for (let x = 0; x < GRID_COLS; x++) {
      grid[0][x] = CELL.WALL;
      grid[GRID_ROWS - 1][x] = CELL.WALL;
    }
    for (let y = 0; y < GRID_ROWS; y++) {
      grid[y][0] = CELL.WALL;
      grid[y][GRID_COLS - 1] = CELL.WALL;
    }

    // Zonas fixas (Gôndolas, Balcões, Caixas)
    env.zones.forEach(z => {
      for (let y = z.y1; y <= z.y2; y++) {
        for (let x = z.x1; x <= z.x2; x++) {
          if (y > 0 && y < GRID_ROWS - 1 && x > 0 && x < GRID_COLS - 1) {
            grid[y][x] = z.type;
          }
        }
      }
    });

    // Obstáculos temporários inseridos pelo simulador
    obstacles.forEach(obs => {
      if (grid[obs.y] && grid[obs.y][obs.x] === CELL.FREE) {
        grid[obs.y][obs.x] = CELL.OBSTACLE;
      }
    });

    return grid;
  },

  /**
   * Calcula o caminho mais curto (BFS) na malha 2D desviando de gôndolas, paredes e obstáculos
   */
  findShortestPathBFS(grid, startX, startY, targetX, targetY) {
    const visited = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
    const parent = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    const queue = [{ x: startX, y: startY }];

    if (startY < 0 || startY >= GRID_ROWS || startX < 0 || startX >= GRID_COLS) return [];
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.x === targetX && curr.y === targetY) {
        const path = [];
        let step = curr;
        while (step) {
          path.unshift({ x: step.x, y: step.y });
          step = parent[step.y][step.x];
        }
        return path;
      }

      for (const d of DIRS) {
        const nx = curr.x + d.dx;
        const ny = curr.y + d.dy;
        if (
          nx >= 0 && nx < GRID_COLS &&
          ny >= 0 && ny < GRID_ROWS &&
          !visited[ny][nx] &&
          grid[ny][nx] === CELL.FREE
        ) {
          visited[ny][nx] = true;
          parent[ny][nx] = curr;
          queue.push({ x: nx, y: ny });
        }
      }
    }
    return [];
  },

  /**
   * Ordena uma lista de produtos (Lista de Compras) pela rota mais eficiente a partir da posição atual
   */
  optimizeMultiStopList(grid, startX, startY, items) {
    const remaining = [...items];
    const ordered = [];
    let currX = startX;
    let currY = startY;

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;

      remaining.forEach((item, idx) => {
        const path = this.findShortestPathBFS(grid, currX, currY, item.x, item.y);
        const dist = path.length > 0 ? path.length : 9999;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      const chosen = remaining.splice(bestIdx, 1)[0];
      ordered.push(chosen);
      currX = chosen.x;
      currY = chosen.y;
    }

    return ordered;
  },

  /**
   * Retorna o índice de direção (0=N, 1=E, 2=S, 3=W) para um deslocamento unitário (dx, dy)
   */
  dirIndexFromDelta(dx, dy) {
    return DIRS.findIndex(d => d.dx === dx && d.dy === dy);
  },

  /**
   * Descreve o giro anatômico necessário entre duas direções cardeais
   */
  getRelativeTurn(fromDirIdx, toDirIdx) {
    const diff = (toDirIdx - fromDirIdx + 4) % 4;
    if (diff === 0) return { code: "straight", text: "Continue em frente" };
    if (diff === 1) return { code: "turnRight", text: "Vire 90 graus à sua direita" };
    if (diff === 3) return { code: "turnLeft", text: "Vire 90 graus à sua esquerda" };
    return { code: "turnBack", text: "Dê meia-volta (180 graus)" };
  },

  /**
   * Determina a posição relativa ao corpo do usuário ("à sua frente", "à sua direita", "à sua esquerda", "atrás de você")
   */
  getBodyRelativeDirection(userPose, tx, ty) {
    const dx = tx - userPose.x;
    const dy = ty - userPose.y;
    if (dx === 0 && dy === 0) return "exatamente na sua posição atual";

    const userAngle = DIRS[userPose.dirIdx].angle;
    let targetAngle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (targetAngle < 0) targetAngle += 360;

    const rel = (targetAngle - userAngle + 360) % 360;
    if (rel >= 315 || rel < 45) return "à sua frente";
    if (rel >= 45 && rel < 135) return "à sua direita";
    if (rel >= 135 && rel < 225) return "atrás de você";
    return "à sua esquerda";
  },

  /**
   * Identifica um ponto de referência físico (corredor ou seção próxima) para enriquecer a instrução
   */
  describeLandmark(env, x, y) {
    for (const a of env.aisleLabels) {
      if (a.x === x && y >= a.y1 && y <= a.y2) {
        return `o início do ${a.name}`;
      }
    }
    for (const z of env.zones) {
      if (x >= z.x1 - 1 && x <= z.x2 + 1 && y >= z.y1 - 1 && y <= z.y2 + 1) {
        return `a referência de ${z.name.split("(")[0].trim()}`;
      }
    }
    return `o cruzamento do corredor (X:${x}, Y:${y})`;
  },

  /**
   * Gera a instrução auditiva ativa relativa ao corpo do usuário
   */
  buildActiveInstruction(env, userPose, targetItem, route) {
    if (!targetItem) {
      return "Nenhum destino selecionado. Escolha um produto ou seção no catálogo ou use o comando de voz.";
    }

    // Caso o usuário já tenha chegado às coordenadas do item
    if (userPose.x === targetItem.x && userPose.y === targetItem.y) {
      const shelfRel = this.getBodyRelativeDirection(userPose, targetItem.shelfX, targetItem.shelfY);
      const heightDesc = SHELF_HEIGHT_DESC[targetItem.height] || "altura do peito";
      return `Você chegou ao destino! ${targetItem.name} está na gôndola ${shelfRel} (lado ${targetItem.side} de ${targetItem.aisle}), na ${heightDesc}. ${targetItem.tactileTip || ""}`;
    }

    if (!route || route.length < 2) {
      return `Atenção: não há caminho livre até ${targetItem.name}. Verifique se há obstáculos bloqueando o corredor.`;
    }

    const nextNode = route[1];
    const firstDx = nextNode.x - userPose.x;
    const firstDy = nextNode.y - userPose.y;
    const neededDirIdx = this.dirIndexFromDelta(firstDx, firstDy);

    // Conta quantas células consecutivas seguem na mesma linha reta
    let straightCells = 0;
    for (let i = 1; i < route.length; i++) {
      const dx = route[i].x - route[i - 1].x;
      const dy = route[i].y - route[i - 1].y;
      if (dx === firstDx && dy === firstDy) {
        straightCells++;
      } else {
        break;
      }
    }

    const steps = straightCells * STEPS_PER_CELL;
    const turn = this.getRelativeTurn(userPose.dirIdx, neededDirIdx);
    const segmentEnd = route[straightCells];
    const landmark = this.describeLandmark(env, segmentEnd.x, segmentEnd.y);
    const reachesTarget = (segmentEnd.x === targetItem.x && segmentEnd.y === targetItem.y);
    const heightDesc = SHELF_HEIGHT_DESC[targetItem.height] || "terceira prateleira (altura do peito)";

    if (turn.code === "straight") {
      if (reachesTarget) {
        return `Caminhe em frente por aproximadamente ${steps} passos até ${targetItem.name}. O produto estará na gôndola à sua ${targetItem.side}, na ${heightDesc}.`;
      }
      return `Caminhe em frente por aproximadamente ${steps} passos até ${landmark}.`;
    } else {
      if (reachesTarget) {
        return `${turn.text} e caminhe por aproximadamente ${steps} passos. ${targetItem.name} estará na gôndola à sua ${targetItem.side}, na ${heightDesc}.`;
      }
      return `${turn.text} e caminhe em frente por aproximadamente ${steps} passos até ${landmark}.`;
    }
  },

  /**
   * Converte toda a rota BFS em uma lista ordenada de instruções humanas passo a passo
   */
  buildFullTurnByTurnList(env, userPose, targetItem, route) {
    if (!targetItem) return [];
    if (userPose.x === targetItem.x && userPose.y === targetItem.y) {
      const heightDesc = SHELF_HEIGHT_DESC[targetItem.height] || "terceira prateleira (altura do peito)";
      return [
        `Destino alcançado: ${targetItem.name} está na gôndola à sua ${targetItem.side}, na ${heightDesc}.`
      ];
    }
    if (!route || route.length < 2) return ["Rota bloqueada por obstáculos."];

    const instructions = [];
    let simDir = userPose.dirIdx;
    let i = 1;

    while (i < route.length) {
      const dx = route[i].x - route[i - 1].x;
      const dy = route[i].y - route[i - 1].y;
      const segDir = this.dirIndexFromDelta(dx, dy);

      let count = 0;
      while (
        i < route.length &&
        route[i].x - route[i - 1].x === dx &&
        route[i].y - route[i - 1].y === dy
      ) {
        count++;
        i++;
      }

      const steps = count * STEPS_PER_CELL;
      const endNode = route[i - 1];
      const turn = this.getRelativeTurn(simDir, segDir);
      const landmark = this.describeLandmark(env, endNode.x, endNode.y);

      if (turn.code === "straight") {
        instructions.push(`Caminhe em frente por aproximadamente ${steps} passos até ${landmark}.`);
      } else {
        instructions.push(`${turn.text} e caminhe por aproximadamente ${steps} passos até ${landmark}.`);
      }
      simDir = segDir;
    }

    const heightDesc = SHELF_HEIGHT_DESC[targetItem.height] || "terceira prateleira (altura do peito)";
    instructions.push(
      `Chegada: ${targetItem.name} estará na gôndola à sua ${targetItem.side}, na ${heightDesc}.`
    );

    return instructions;
  }
};

