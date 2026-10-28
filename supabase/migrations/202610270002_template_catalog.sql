-- Apenas catálogo oficial. Não cria clientes, leads, importações ou protótipos fictícios.
begin;
insert into public.templates(slug, name, niche, variant, description, status) values
('clinicas-a','Institucional Premium','clinicas','A','Uma presença acolhedora, com foco na confiança e na especialidade da clínica.','planned'),
('clinicas-b','Serviços e Agendamentos','clinicas','B','Serviços em destaque e uma jornada direta até o agendamento.','planned'),
('advocacia-a','Clássico e Sofisticado','advocacia','A','Tradição e autoridade em uma composição editorial sóbria.','planned'),
('advocacia-b','Moderno e Minimalista','advocacia','B','Clareza e precisão para apresentar áreas de atuação e equipe.','planned'),
('imobiliarias-a','Imobiliária Premium','imobiliarias','A','Uma vitrine elegante para imóveis e oportunidades exclusivas.','planned'),
('imobiliarias-b','Corretor Pessoal','imobiliarias','B','Atendimento próximo, marca pessoal e imóveis selecionados.','planned'),
('restaurantes-a','Gastronômico Premium','restaurantes','A','Atmosfera e identidade para valorizar a experiência gastronômica.','planned'),
('restaurantes-b','Cardápio e Pedidos','restaurantes','B','Um cardápio acessível com caminho simples para novos pedidos.','planned');
commit;
