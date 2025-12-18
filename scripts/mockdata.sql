-- =====================================================
-- MOCK DATA PARA SISTEMA AV CONTINUA - SUPABASE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar Áreas
INSERT INTO "Area" (id, nome, "createdAt") VALUES
(1, 'Desenvolvimento', NOW()),
(2, 'Design', NOW()),
(3, 'Marketing', NOW()),
(4, 'Gestão', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Criar Coordenador
INSERT INTO "Coordenador" (id, nome, usuario, "senhaHash", "createdAt", "updatedAt") VALUES
(1, 'Admin Coordenador', 'admin', 'hash_placeholder', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Criar Membros
INSERT INTO "Membro" (id, nome, "fotoUrl", dre, periodo, "isAtivo", "areaId", "createdAt", "updatedAt") VALUES
(1, 'Gabriel Silva', NULL, '12345678', '2023.1', true, 1, NOW(), NOW()),
(2, 'Ana Costa', NULL, '23456789', '2023.1', true, 2, NOW(), NOW()),
(3, 'Pedro Santos', NULL, '34567890', '2023.2', true, 1, NOW(), NOW()),
(4, 'Maria Oliveira', NULL, '45678901', '2022.2', true, 3, NOW(), NOW()),
(5, 'Lucas Lima', NULL, '56789012', '2023.1', true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Criar Avaliações (6 ciclos mensais)
INSERT INTO "Avaliacao" (id, nome, "dataInicio", "dataFim", finalizada, "createdById", "createdAt") VALUES
(1, 'Ciclo Julho 2024', '2024-07-01', '2024-07-31', true, 1, '2024-07-01'),
(2, 'Ciclo Agosto 2024', '2024-08-01', '2024-08-31', true, 1, '2024-08-01'),
(3, 'Ciclo Setembro 2024', '2024-09-01', '2024-09-30', true, 1, '2024-09-01'),
(4, 'Ciclo Outubro 2024', '2024-10-01', '2024-10-31', true, 1, '2024-10-01'),
(5, 'Ciclo Novembro 2024', '2024-11-01', '2024-11-30', true, 1, '2024-11-01'),
(6, 'Ciclo Dezembro 2024', '2024-12-01', NULL, false, 1, '2024-12-01')
ON CONFLICT (id) DO NOTHING;

-- 5. Criar Participações nas Avaliações (Membro 1 em todas)
INSERT INTO "ParticipacaoAvaliacao" (id, "avaliacaoId", "membroId", "respondeuAvaliacao", "avaliouFeedbacks") VALUES
(1, 1, 1, true, true),
(2, 2, 1, true, true),
(3, 3, 1, true, true),
(4, 4, 1, true, true),
(5, 5, 1, true, true),
(6, 6, 1, false, false),  -- Avaliação pendente no ciclo atual
(7, 1, 2, true, true),
(8, 2, 2, true, true),
(9, 3, 2, true, true),
(10, 4, 2, true, true),
(11, 5, 2, true, true),
(12, 6, 2, true, false)
ON CONFLICT (id) DO NOTHING;

-- 6. Criar Respostas de Avaliação para Membro 1 (avaliado por outros)
-- Ciclo Julho (avaliação 1)
INSERT INTO "RespostaAvaliacao" (id, "avaliacaoId", "avaliadorId", "avaliadoId", "notaEntrega", "notaCultura", "feedbackTexto", "createdAt", "updatedAt") VALUES
(1, 1, 2, 1, 4, 3, 'Bom trabalho em julho', '2024-07-15', '2024-07-15'),
(2, 1, 3, 1, 3, 4, 'Boa colaboração', '2024-07-16', '2024-07-16'),
(3, 1, 4, 1, 4, 4, 'Proativo', '2024-07-17', '2024-07-17'),

-- Ciclo Agosto (avaliação 2)
(4, 2, 2, 1, 4, 4, 'Melhorou bastante', '2024-08-15', '2024-08-15'),
(5, 2, 3, 1, 4, 3, 'Consistente', '2024-08-16', '2024-08-16'),
(6, 2, 4, 1, 5, 4, 'Excelente entrega', '2024-08-17', '2024-08-17'),

-- Ciclo Setembro (avaliação 3)
(7, 3, 2, 1, 3, 4, 'Mês desafiador', '2024-09-15', '2024-09-15'),
(8, 3, 3, 1, 4, 4, 'Superou expectativas', '2024-09-16', '2024-09-16'),
(9, 3, 4, 1, 4, 5, 'Alinhado com valores', '2024-09-17', '2024-09-17'),

-- Ciclo Outubro (avaliação 4)
(10, 4, 2, 1, 5, 4, 'Ótimo mês', '2024-10-15', '2024-10-15'),
(11, 4, 3, 1, 4, 4, 'Manteve qualidade', '2024-10-16', '2024-10-16'),
(12, 4, 4, 1, 4, 5, 'Exemplar', '2024-10-17', '2024-10-17'),

-- Ciclo Novembro (avaliação 5)
(13, 5, 2, 1, 5, 5, 'Melhor mês', '2024-11-15', '2024-11-15'),
(14, 5, 3, 1, 5, 4, 'Consistente', '2024-11-16', '2024-11-16'),
(15, 5, 4, 1, 4, 5, 'Muito bem', '2024-11-17', '2024-11-17'),

-- Ciclo Dezembro (avaliação 6 - atual)
(16, 6, 2, 1, 5, 5, 'Excelente fechamento', '2024-12-10', '2024-12-10'),
(17, 6, 3, 1, 5, 5, 'Ótima performance', '2024-12-11', '2024-12-11')
ON CONFLICT (id) DO NOTHING;

-- Avaliações feitas pelo Membro 1 (avaliando outros)
INSERT INTO "RespostaAvaliacao" (id, "avaliacaoId", "avaliadorId", "avaliadoId", "notaEntrega", "notaCultura", "feedbackTexto", "createdAt", "updatedAt") VALUES
(18, 5, 1, 2, 4, 5, 'Ótimo trabalho Ana', '2024-11-15', '2024-11-15'),
(19, 5, 1, 3, 5, 4, 'Pedro muito dedicado', '2024-11-15', '2024-11-15'),
(20, 6, 1, 2, 5, 5, 'Excelente mês Ana', '2024-12-12', '2024-12-12')
ON CONFLICT (id) DO NOTHING;

-- 7. Criar Feedbacks sobre as avaliações recebidas pelo Membro 1
INSERT INTO "AvaliacaoFeedback" (id, "respostaAvaliacaoId", "avaliadoId", "notaFeedback", "createdAt") VALUES
-- Julho
(1, 1, 1, 4, '2024-07-20'),
(2, 2, 1, 3, '2024-07-21'),
(3, 3, 1, 4, '2024-07-22'),

-- Agosto
(4, 4, 1, 4, '2024-08-20'),
(5, 5, 1, 4, '2024-08-21'),
(6, 6, 1, 5, '2024-08-22'),

-- Setembro
(7, 7, 1, 3, '2024-09-20'),
(8, 8, 1, 4, '2024-09-21'),
(9, 9, 1, 5, '2024-09-22'),

-- Outubro
(10, 10, 1, 4, '2024-10-20'),
(11, 11, 1, 4, '2024-10-21'),
(12, 12, 1, 5, '2024-10-22'),

-- Novembro
(13, 13, 1, 5, '2024-11-20'),
(14, 14, 1, 5, '2024-11-21'),
(15, 15, 1, 4, '2024-11-22'),

-- Dezembro (atual)
(16, 16, 1, 5, '2024-12-15'),
(17, 17, 1, 5, '2024-12-16')
ON CONFLICT (id) DO NOTHING;

-- 8. Atualizar sequences para próximos inserts
SELECT setval('"Area_id_seq"', (SELECT MAX(id) FROM "Area"));
SELECT setval('"Coordenador_id_seq"', (SELECT MAX(id) FROM "Coordenador"));
SELECT setval('"Membro_id_seq"', (SELECT MAX(id) FROM "Membro"));
SELECT setval('"Avaliacao_id_seq"', (SELECT MAX(id) FROM "Avaliacao"));
SELECT setval('"ParticipacaoAvaliacao_id_seq"', (SELECT MAX(id) FROM "ParticipacaoAvaliacao"));
SELECT setval('"RespostaAvaliacao_id_seq"', (SELECT MAX(id) FROM "RespostaAvaliacao"));
SELECT setval('"AvaliacaoFeedback_id_seq"', (SELECT MAX(id) FROM "AvaliacaoFeedback"));

-- =====================================================
-- RESULTADO ESPERADO PARA MEMBRO 1 (Gabriel Silva):
-- 
-- Médias Gerais:
--   - Média Entrega: ~4.2
--   - Média Cultura: ~4.2
--
-- Evolução por Mês (Membro 1):
--   Jul: Entrega=3.7, Cultura=3.7, Feedback=3.7
--   Ago: Entrega=4.3, Cultura=3.7, Feedback=4.3
--   Set: Entrega=3.7, Cultura=4.3, Feedback=4.0
--   Out: Entrega=4.3, Cultura=4.3, Feedback=4.3
--   Nov: Entrega=4.7, Cultura=4.7, Feedback=4.7
--   Dez: Entrega=5.0, Cultura=5.0, Feedback=5.0
--
-- Avaliação Pendente: SIM (ciclo 6, dezembro)
-- =====================================================
