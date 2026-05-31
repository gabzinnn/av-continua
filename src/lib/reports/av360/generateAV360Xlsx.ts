import ExcelJS from "exceljs";
import type { AV360XlsxData, AV360XlsxMembro } from "@/src/actions/avaliacao360Actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const VALOR_BG: Record<string, string> = {
    'Obsessão pelo aprendizado': 'FF674EA7',
    'Excelência':                'FF3C78D8',
    'Protagonismo':              'FF38761D',
    'Amizade':                   'FFE06666',
    'Transparência':             'FFF6B26B',
    'Responsabilidade Coletiva': 'FF76A5AF',
};

const CRITERIO_BG: Record<string, string> = {
    'Obsessão pelo aprendizado': 'FFB4A7D6',
    'Excelência':                'FFA4C2F4',
    'Protagonismo':              'FFB6D7A8',
    'Amizade':                   'FFEA9999',
    'Transparência':             'FFFFE599',
    'Responsabilidade Coletiva': 'FFA2C4C9',
};

const SPACER_BG = 'FFBDBDBD';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mediaColor(value: number): string {
    if (value <= 5.50) return 'FFFF0000'; // Vermelho (#ff0000)
    if (value <= 6.00) return 'FFE36C09'; // Laranja (#e36c09)
    if (value <= 6.50) return 'FFF1C232'; // Amarelo (#f1c232)
    if (value <= 7.00) return 'FFAFD7A2'; // Verde Claro (#afd7a2)
    if (value <= 8.00) return 'FF84DA5E'; // Verde Médio (#84da5e)
    return 'FF43BC00';                   // Verde Escuro (#43bc00)
}

/** Font color for Média cells — always white. */
function mediaFg(value: number): string {
    return 'FFFFFFFF';
}

function getDesvioColor(desvio: number): string {
    if (desvio < 0.95) return 'FF381850'; // Roxo Escuro (#381850)
    return 'FF7030A0';                    // Roxo Claro (#7030a0)
}

function getDiscColor(value: number): string {
    if (value < -0.80) return 'FFFF0000'; // Vermelho (#ff0000)
    if (value <= 0.80) return 'FF000000'; // Preto (#000000)
    return 'FF3D85C6';                    // Azul (#3d85c6)
}

function scoreColor(value: number): { bg: string; fg: string } {
    if (value >= 9.0) return { bg: 'FF22c55e', fg: 'FF000000' };
    if (value >= 7.5) return { bg: 'FF86efac', fg: 'FF000000' };
    if (value >= 6.0) return { bg: 'FFfde047', fg: 'FF000000' };
    if (value >= 4.5) return { bg: 'FFfb923c', fg: 'FF000000' };
    return { bg: 'FFef4444', fg: 'FFffffff' };
}

// ─── Column layout helpers ────────────────────────────────────────────────────
//
// Layout per area sheet (reference):
//   A(1): left spacer
//   B(2): Valor name (merged vertically per dim)
//   C(3): criterion text
//   D(4): mid spacer
//   --- Area aggregate block (2 cols + 1 spacer = 3 cols) ---
//     E(5): Média por Valor (merged vertically per dim)
//     F(6): Média
//     G(7): spacer
//   --- For member i (0-indexed), each block is 5 cols ---
//     8+i*5: Média por Valor (merged vertically per dim)
//     9+i*5: Média
//    10+i*5: Desvio Padrão
//    11+i*5: Discrepância
//    12+i*5: right spacer

const COL_LEFT  = 1;
const COL_VALOR = 2;
const COL_CRIT  = 3;
const COL_MID   = 4;

// Area aggregate columns
const COL_AREA_MV      = 5;
const COL_AREA_MEDIA   = 6;
const COL_AREA_SPACER  = 7;

// Individual member columns (offset after area block)
const MEMBER_BASE_OFFSET = 8; // First member starts at column 8
const memberBase = (i: number) => MEMBER_BASE_OFFSET + i * 5;
const colMV      = (i: number) => memberBase(i);
const colMedia   = (i: number) => memberBase(i) + 1;
const colDesvio  = (i: number) => memberBase(i) + 2;
const colDisc    = (i: number) => memberBase(i) + 3;
const colSpacer  = (i: number) => memberBase(i) + 4;

function fill(cell: ExcelJS.Cell, argb: string) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    cell.border = THIN_BORDER;
}

function styled(
    cell: ExcelJS.Cell,
    value: ExcelJS.CellValue,
    opts: {
        bg?: string;
        fg?: string;
        fontName?: string;
        size?: number;
        bold?: boolean;
        halign?: ExcelJS.Alignment["horizontal"];
        valign?: ExcelJS.Alignment["vertical"];
        wrap?: boolean;
    } = {}
) {
    if (value !== undefined) cell.value = value;
    if (opts.bg) fill(cell, opts.bg);
    cell.font = {
        name: opts.fontName ?? 'Montserrat',
        size: opts.size ?? 10,
        bold: opts.bold ?? false,
        color: { argb: opts.fg ?? 'FF000000' },
    };
    cell.alignment = {
        horizontal: opts.halign ?? 'center',
        vertical: opts.valign ?? 'middle',
        wrapText: opts.wrap ?? true,
    };
    cell.border = THIN_BORDER;
}

/**
 * Compute per-criterion averages across all members of an area
 * for the area aggregate block.
 */
function computeAreaAggregate(membros: AV360XlsxMembro[]): AV360XlsxMembro["dimensoes"] {
    if (membros.length === 0) return [];
    const template = membros[0].dimensoes;
    return template.map((dim, di) => {
        const criterios = dim.criterios.map((crit, ci) => {
            const medias = membros
                .map(m => m.dimensoes[di]?.criterios[ci]?.media ?? 0)
                .filter(v => v > 0);
            const avgMedia = medias.length > 0
                ? medias.reduce((s, v) => s + v, 0) / medias.length
                : 0;
            return {
                texto: crit.texto,
                media: Number(avgMedia.toFixed(2)),
                desvio: 0,
                discrepancia: 0,
            };
        });
        const dimMedias = membros
            .map(m => m.dimensoes[di]?.media ?? 0)
            .filter(v => v > 0);
        const avgDimMedia = dimMedias.length > 0
            ? dimMedias.reduce((s, v) => s + v, 0) / dimMedias.length
            : 0;
        return {
            titulo: dim.titulo,
            media: Number(avgDimMedia.toFixed(2)),
            desvio: 0,
            criterios,
        };
    });
}

// ─── Resumo sheet ─────────────────────────────────────────────────────────────

function buildResumoSheet(wb: ExcelJS.Workbook, data: AV360XlsxData) {
    const ws = wb.addWorksheet('Resumo', { views: [{ state: 'frozen', ySplit: 2 }] });

    const numDims = data.dimensoesTitulos.length;
    const totalCols = 3 + numDims;

    ws.getColumn(1).width = 32;
    ws.getColumn(2).width = 22;
    ws.getColumn(3).width = 14;
    for (let i = 4; i <= totalCols; i++) ws.getColumn(i).width = 16;

    // Row 1: title
    const r1 = ws.addRow([data.nome]);
    ws.mergeCells(`A1:${ws.getColumn(totalCols).letter}1`);
    styled(r1.getCell(1), data.nome, { bg: 'FFfde047', fg: 'FF000000', size: 13, bold: true });
    r1.height = 22;

    // Row 2: headers
    const headerVals = ['Nome', 'Área', 'Score Geral', ...data.dimensoesTitulos];
    const r2 = ws.addRow(headerVals);
    r2.eachCell(cell => styled(cell, undefined, { bg: 'FF1a1a1a', fg: 'FFFFFFFF', bold: true }));
    r2.height = 18;

    // Data rows sorted by score desc
    const sorted = [...data.membros].sort((a, b) => b.scoreGeral - a.scoreGeral);
    for (const m of sorted) {
        const row = ws.addRow([m.nome, m.area, m.scoreGeral, ...m.dimensoes.map(d => d.media)]);
        styled(row.getCell(1), undefined, { bg: 'FF2a2a2a', fg: 'FFFFFFFF' });
        styled(row.getCell(2), undefined, { bg: 'FF2a2a2a', fg: 'FFFFFFFF' });
        const sc = scoreColor(m.scoreGeral);
        styled(row.getCell(3), undefined, { bg: sc.bg, fg: sc.fg, bold: true });
        for (let i = 0; i < numDims; i++) {
            const dc = scoreColor(m.dimensoes[i]?.media ?? 0);
            styled(row.getCell(4 + i), undefined, { bg: dc.bg, fg: dc.fg, bold: true });
        }
        row.height = 16;
    }
}

// ─── Area sheet ───────────────────────────────────────────────────────────────

function buildAreaSheet(
    wb: ExcelJS.Workbook,
    areaNome: string,
    membros: AV360XlsxMembro[],
    destaque?: string,
) {
    const ws = wb.addWorksheet(areaNome.slice(0, 31));
    const n = membros.length;
    // Total columns: 4 (fixed) + 3 (area aggregate) + n*5 (individual members)
    const totalCols = 4 + 3 + n * 5;

    // ── Column widths (reference values) ──────────────────────────────────────
    ws.getColumn(COL_LEFT).width   = 5.86;
    ws.getColumn(COL_VALOR).width  = 14;
    ws.getColumn(COL_CRIT).width   = 58.71;
    ws.getColumn(COL_MID).width    = 14.29;

    // Area aggregate block widths
    ws.getColumn(COL_AREA_MV).width     = 14.29;
    ws.getColumn(COL_AREA_MEDIA).width  = 10.14;
    ws.getColumn(COL_AREA_SPACER).width = 10.14;

    // Individual member block widths
    for (let i = 0; i < n; i++) {
        ws.getColumn(colMV(i)).width     = 14.29;
        ws.getColumn(colMedia(i)).width  = 10.14;
        ws.getColumn(colDesvio(i)).width = 8.71;
        ws.getColumn(colDisc(i)).width   = 12.43;
        ws.getColumn(colSpacer(i)).width = 10.14;
    }

    // ── Row 1: gray header bar ────────────────────────────────────────────────
    const row1 = ws.getRow(1);
    row1.height = 22.5;
    for (let c = 1; c <= totalCols; c++) fill(ws.getCell(1, c), SPACER_BG);

    // ── Row 2: destaque + area name + member names ────────────────────────────
    const row2 = ws.getRow(2);
    row2.height = 46.5;

    // Cols A-D: destaque area
    fill(ws.getCell(2, COL_LEFT), SPACER_BG);
    styled(ws.getCell(2, COL_VALOR), 'Destaque', {
        bg: 'FFFAD419', fg: 'FF000000', fontName: 'Montserrat', size: 11, bold: true,
    });
    styled(ws.getCell(2, COL_CRIT), destaque ?? '', {
        bg: 'FF0C0C0C', fg: 'FFFFFFFF', fontName: 'Montserrat', size: 10,
        halign: 'left', wrap: true,
    });
    fill(ws.getCell(2, COL_MID), SPACER_BG);

    // Area aggregate name in row 2 (merge area MV + area Media)
    ws.mergeCells(2, COL_AREA_MV, 2, COL_AREA_MEDIA);
    styled(ws.getCell(2, COL_AREA_MV), areaNome, {
        bg: 'FF000000', fg: 'FFFFFFFF', fontName: 'Montserrat', size: 11, bold: true,
    });
    fill(ws.getCell(2, COL_AREA_SPACER), SPACER_BG);

    // Individual member names in row 2
    for (let i = 0; i < n; i++) {
        ws.mergeCells(2, colMV(i), 2, colDisc(i));
        styled(ws.getCell(2, colMV(i)), membros[i].nome, {
            bg: 'FF000000', fg: 'FFFFFFFF', fontName: 'Montserrat', size: 11, bold: true,
        });
        fill(ws.getCell(2, colSpacer(i)), SPACER_BG);
    }

    // ── Row 3: column headers ─────────────────────────────────────────────────
    const row3 = ws.getRow(3);
    row3.height = 33.0;
    fill(ws.getCell(3, COL_LEFT), 'FFFAD419');
    styled(ws.getCell(3, COL_VALOR), 'Valor',    { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
    styled(ws.getCell(3, COL_CRIT),  'Critério', { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
    fill(ws.getCell(3, COL_MID), 'FFFAD419');

    // Area aggregate headers (only MV + Média)
    styled(ws.getCell(3, COL_AREA_MV),    'Média por Valor', { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
    styled(ws.getCell(3, COL_AREA_MEDIA), 'Média',           { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
    fill(ws.getCell(3, COL_AREA_SPACER), 'FFFAD419');

    // Individual member headers
    for (let i = 0; i < n; i++) {
        styled(ws.getCell(3, colMV(i)),     'Média por Valor',  { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
        styled(ws.getCell(3, colMedia(i)),  'Média',            { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
        styled(ws.getCell(3, colDesvio(i)), 'Desvio Padrão',    { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
        styled(ws.getCell(3, colDisc(i)),   'Discrepância',     { bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11 });
        fill(ws.getCell(3, colSpacer(i)), 'FFFAD419');
    }

    // ── Compute area aggregate data ───────────────────────────────────────────
    const areaAgg = computeAreaAggregate(membros);

    // ── Data rows ─────────────────────────────────────────────────────────────
    const dims = membros[0]?.dimensoes ?? [];
    let currentRow = 4;

    for (let dIdx = 0; dIdx < dims.length; dIdx++) {
        const dim = dims[dIdx];
        const numCrit = dim.criterios.length;
        if (numCrit === 0) continue;

        const dimStart = currentRow;
        const dimEnd   = currentRow + numCrit - 1;

        const valorBg   = VALOR_BG[dim.titulo]   ?? 'FF674EA7';
        const criterioBg = CRITERIO_BG[dim.titulo] ?? 'FFB4A7D6';
        const critTextFg = 'FF000000';

        // Col A: spacer, merged vertically (uniform gray)
        if (numCrit > 1) ws.mergeCells(dimStart, COL_LEFT, dimEnd, COL_LEFT);
        fill(ws.getCell(dimStart, COL_LEFT), SPACER_BG);

        // Col B: Valor name, merged vertically
        if (numCrit > 1) ws.mergeCells(dimStart, COL_VALOR, dimEnd, COL_VALOR);
        styled(ws.getCell(dimStart, COL_VALOR), dim.titulo, {
            bg: valorBg, fg: 'FFFFFFFF',
            fontName: 'Hammersmith One', size: 14,
        });

        // Col D: mid spacer, merged vertically (uniform gray)
        if (numCrit > 1) ws.mergeCells(dimStart, COL_MID, dimEnd, COL_MID);
        fill(ws.getCell(dimStart, COL_MID), SPACER_BG);

        // ── Area aggregate: Média por Valor (merged) + spacer (merged) ────
        const aggDim = areaAgg[dIdx];
        const aggMediaValor = aggDim?.media ?? 0;

        if (numCrit > 1) ws.mergeCells(dimStart, COL_AREA_MV, dimEnd, COL_AREA_MV);
        styled(ws.getCell(dimStart, COL_AREA_MV), Number(aggMediaValor.toFixed(2)), {
            bg: mediaColor(aggMediaValor), fg: mediaFg(aggMediaValor),
            fontName: 'Montserrat', size: 13, bold: true,
        });

        if (numCrit > 1) ws.mergeCells(dimStart, COL_AREA_SPACER, dimEnd, COL_AREA_SPACER);
        fill(ws.getCell(dimStart, COL_AREA_SPACER), SPACER_BG);

        // ── Per-member: Média por Valor (merged) + spacer (merged) ────────
        for (let i = 0; i < n; i++) {
            const memberDim = membros[i].dimensoes.find(d => d.titulo === dim.titulo);
            const mediaValor = memberDim?.media ?? 0;
            const mediaValorNum = Number(mediaValor.toFixed(2));

            if (numCrit > 1) ws.mergeCells(dimStart, colMV(i), dimEnd, colMV(i));
            styled(ws.getCell(dimStart, colMV(i)), mediaValorNum, {
                bg: mediaColor(mediaValorNum), fg: mediaFg(mediaValorNum),
                fontName: 'Montserrat', size: 13, bold: true,
            });

            if (numCrit > 1) ws.mergeCells(dimStart, colSpacer(i), dimEnd, colSpacer(i));
            fill(ws.getCell(dimStart, colSpacer(i)), SPACER_BG);
        }

        // ── Criterion rows ────────────────────────────────────────────────
        for (let ci = 0; ci < numCrit; ci++) {
            const rowNum = currentRow + ci;
            ws.getRow(rowNum).height = 52.5;

            const crit = dim.criterios[ci];

            // Col C: criterion text (center aligned per reference)
            styled(ws.getCell(rowNum, COL_CRIT), crit.texto, {
                bg: criterioBg, fg: critTextFg,
                fontName: 'Montserrat', size: 10, halign: 'center', wrap: true,
            });

            // ── Area aggregate: Média per criterion ───────────────────────
            const aggCrit = aggDim?.criterios[ci];
            const aggCritMedia = aggCrit?.media ?? 0;
            styled(ws.getCell(rowNum, COL_AREA_MEDIA), Number(aggCritMedia.toFixed(2)), {
                bg: mediaColor(aggCritMedia), fg: mediaFg(aggCritMedia),
                fontName: 'Montserrat', size: 13, bold: true,
            });

            // ── Per-member data cells ─────────────────────────────────────
            for (let i = 0; i < n; i++) {
                const memberDim = membros[i].dimensoes.find(d => d.titulo === dim.titulo);
                const c = memberDim?.criterios[ci];

                // Média — score-based color (not member color)
                const critMediaVal = c ? Number(c.media.toFixed(2)) : 0;
                styled(ws.getCell(rowNum, colMedia(i)), critMediaVal, {
                    bg: mediaColor(critMediaVal), fg: mediaFg(critMediaVal),
                    fontName: 'Montserrat', size: 13, bold: true,
                });

                // Desvio Padrão
                const desvio = c?.desvio ?? 0;
                styled(ws.getCell(rowNum, colDesvio(i)), Number(desvio.toFixed(2)), {
                    bg: getDesvioColor(desvio), fg: 'FFFFFFFF',
                    fontName: 'Montserrat', size: 13, bold: true,
                });

                // Discrepância
                const discVal = c ? Number(c.discrepancia.toFixed(2)) : 0;
                styled(ws.getCell(rowNum, colDisc(i)), discVal, {
                    bg: getDiscColor(discVal), fg: 'FFFFFFFF',
                    fontName: 'Montserrat', size: 13, bold: true,
                });
            }
        }

        currentRow = dimEnd + 1;
    }

    // ── Summary row (2 rows, 4 separate cells per member, merged vertically) ─
    const summaryStart = currentRow;
    const summaryEnd   = currentRow + 1;
    ws.getRow(summaryStart).height = 26.25;
    ws.getRow(summaryEnd).height   = 26.25;

    // Left fixed columns for summary
    ws.mergeCells(summaryStart, COL_LEFT,  summaryEnd, COL_LEFT);
    fill(ws.getCell(summaryStart, COL_LEFT), SPACER_BG);
    ws.mergeCells(summaryStart, COL_VALOR, summaryEnd, COL_VALOR);
    fill(ws.getCell(summaryStart, COL_VALOR), 'FF000000');
    ws.mergeCells(summaryStart, COL_CRIT,  summaryEnd, COL_CRIT);
    styled(ws.getCell(summaryStart, COL_CRIT), 'Médias Gerais', {
        bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11,
    });
    ws.mergeCells(summaryStart, COL_MID,   summaryEnd, COL_MID);
    fill(ws.getCell(summaryStart, COL_MID), 'FFFAD419');

    // Area aggregate summary
    const areaScoreGeral = membros.length > 0
        ? membros.reduce((s, m) => s + m.scoreGeral, 0) / membros.length
        : 0;

    ws.mergeCells(summaryStart, COL_AREA_MV,    summaryEnd, COL_AREA_MV);
    styled(ws.getCell(summaryStart, COL_AREA_MV), 'Média Geral', {
        bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11,
    });
    ws.mergeCells(summaryStart, COL_AREA_MEDIA, summaryEnd, COL_AREA_MEDIA);
    styled(ws.getCell(summaryStart, COL_AREA_MEDIA), Number(areaScoreGeral.toFixed(2)), {
        bg: mediaColor(areaScoreGeral), fg: mediaFg(areaScoreGeral),
        fontName: 'Montserrat', size: 13, bold: true,
    });
    ws.mergeCells(summaryStart, COL_AREA_SPACER, summaryEnd, COL_AREA_SPACER);
    fill(ws.getCell(summaryStart, COL_AREA_SPACER), SPACER_BG);

    // Per-member summary: 4 cells (MV: "Média Geral", Média: value, DP: "Disc. Abs. Média", Disc: value)
    for (let i = 0; i < n; i++) {
        const membro = membros[i];

        // Média por Valor col: "Média Geral" label
        ws.mergeCells(summaryStart, colMV(i), summaryEnd, colMV(i));
        styled(ws.getCell(summaryStart, colMV(i)), 'Média Geral', {
            bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11,
        });

        // Média col: score value with media gradient
        const scoreGeralVal = Number(membro.scoreGeral.toFixed(2));
        ws.mergeCells(summaryStart, colMedia(i), summaryEnd, colMedia(i));
        styled(ws.getCell(summaryStart, colMedia(i)), scoreGeralVal, {
            bg: mediaColor(scoreGeralVal), fg: mediaFg(scoreGeralVal),
            fontName: 'Montserrat', size: 13, bold: true,
        });

        // Desvio Padrão col: "Discrepância Absoluta Média" label
        ws.mergeCells(summaryStart, colDesvio(i), summaryEnd, colDesvio(i));
        styled(ws.getCell(summaryStart, colDesvio(i)), 'Discrepância\nAbsoluta Média', {
            bg: 'FFFAD419', fg: 'FF000000', bold: true, size: 11, wrap: true,
        });

        // Discrepância col: computed absolute mean discrepancy
        const allDiscs = membro.dimensoes.flatMap(d =>
            d.criterios.map(c => Math.abs(c.discrepancia))
        );
        const avgDisc = allDiscs.length > 0
            ? allDiscs.reduce((s, v) => s + v, 0) / allDiscs.length
            : 0;
        const avgDiscVal = Number(avgDisc.toFixed(2));
        ws.mergeCells(summaryStart, colDisc(i), summaryEnd, colDisc(i));
        styled(ws.getCell(summaryStart, colDisc(i)), avgDiscVal, {
            bg: getDiscColor(avgDiscVal), fg: 'FFFFFFFF',
            fontName: 'Montserrat', size: 13, bold: true,
        });

        // Spacer
        ws.mergeCells(summaryStart, colSpacer(i), summaryEnd, colSpacer(i));
        fill(ws.getCell(summaryStart, colSpacer(i)), SPACER_BG);
    }
    currentRow = summaryEnd + 1;

    // ── Spacer row before Pontos Fortes ────────────────────────────────────────
    ws.getRow(currentRow).height = 26.25;
    for (let c = 1; c <= totalCols; c++) fill(ws.getCell(currentRow, c), SPACER_BG);
    currentRow++;

    // ── Pontos Fortes ─────────────────────────────────────────────────────────
    ws.getRow(currentRow).height = 52.5;
    fill(ws.getCell(currentRow, COL_LEFT), SPACER_BG);
    fill(ws.getCell(currentRow, COL_VALOR), SPACER_BG);
    styled(ws.getCell(currentRow, COL_CRIT), 'PONTOS FORTES', {
        bg: 'FF2CA52A', fg: 'FFFFFFFF', fontName: 'Montserrat', size: 18, bold: false,
    });
    fill(ws.getCell(currentRow, COL_MID), SPACER_BG);

    // Area aggregate: empty for pontos fortes
    fill(ws.getCell(currentRow, COL_AREA_MV), SPACER_BG);
    fill(ws.getCell(currentRow, COL_AREA_MEDIA), SPACER_BG);
    fill(ws.getCell(currentRow, COL_AREA_SPACER), SPACER_BG);

    for (let i = 0; i < n; i++) {
        ws.mergeCells(currentRow, colMV(i), currentRow, colDisc(i));
        styled(ws.getCell(currentRow, colMV(i)), membros[i].pontosFortes.join('\n') || '—', {
            bg: 'FF0C0C0C', fg: 'FFFFFFFF', fontName: 'Montserrat', size: 11,
            halign: 'left', wrap: true,
        });
        fill(ws.getCell(currentRow, colSpacer(i)), SPACER_BG);
    }
    currentRow++;

    // ── Pontos a Desenvolver ──────────────────────────────────────────────────
    ws.getRow(currentRow).height = 52.5;
    fill(ws.getCell(currentRow, COL_LEFT), SPACER_BG);
    fill(ws.getCell(currentRow, COL_VALOR), SPACER_BG);
    styled(ws.getCell(currentRow, COL_CRIT), 'PONTOS A DESENVOLVER', {
        bg: 'FFCC0000', fg: 'FFFFFFFF', fontName: 'Montserrat', size: 18, bold: false,
    });
    fill(ws.getCell(currentRow, COL_MID), SPACER_BG);

    // Area aggregate: empty for pontos a desenvolver
    fill(ws.getCell(currentRow, COL_AREA_MV), SPACER_BG);
    fill(ws.getCell(currentRow, COL_AREA_MEDIA), SPACER_BG);
    fill(ws.getCell(currentRow, COL_AREA_SPACER), SPACER_BG);

    for (let i = 0; i < n; i++) {
        ws.mergeCells(currentRow, colMV(i), currentRow, colDisc(i));
        styled(ws.getCell(currentRow, colMV(i)), membros[i].pontosDesenvolver.join('\n') || '—', {
            bg: 'FF0C0C0C', fg: 'FFFFFFFF', fontName: 'Montserrat', size: 11,
            halign: 'left', wrap: true,
        });
        fill(ws.getCell(currentRow, colSpacer(i)), SPACER_BG);
    }
    currentRow++;

    // ── Spacer row after Pontos a Desenvolver ─────────────────────────────────
    ws.getRow(currentRow).height = 22.5;
    for (let c = 1; c <= totalCols; c++) fill(ws.getCell(currentRow, c), SPACER_BG);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateAV360Xlsx(data: AV360XlsxData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'UFRJ Consulting Club';

    buildResumoSheet(wb, data);

    const areaOrder: string[] = [];
    const membrosPorArea = new Map<string, AV360XlsxMembro[]>();
    for (const m of data.membros) {
        if (!membrosPorArea.has(m.area)) {
            areaOrder.push(m.area);
            membrosPorArea.set(m.area, []);
        }
        membrosPorArea.get(m.area)!.push(m);
    }

    for (const area of areaOrder) {
        buildAreaSheet(wb, area, membrosPorArea.get(area)!, data.destaque);
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
