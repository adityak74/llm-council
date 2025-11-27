import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import './Stage2.css';

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  // Replace each "Response X" with the actual model name
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/')[1] || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, aggregateRankings }) {


  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <div className="stage stage2">
      <h3 className="stage-title">Stage 2: Peer Rankings</h3>

      <h4>Raw Evaluations</h4>
      <p className="stage-description">
        Each model evaluated all responses (anonymized as Response A, B, C, etc.) and provided rankings.
        Below, model names are shown in <strong>bold</strong> for readability, but the original evaluation used anonymous labels.
      </p>

      <Tabs defaultValue="0">
        <TabsList>
          {rankings.map((rank, index) => (
            <TabsTrigger key={index} value={String(index)}>
              {rank.model.split('/')[1] || rank.model}
            </TabsTrigger>
          ))}
        </TabsList>

        {rankings.map((rank, index) => (
          <TabsContent key={index} value={String(index)}>
            <div className="tab-content">
              <div className="ranking-model">
                {rank.model}
              </div>
              <div className="ranking-content markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {deAnonymizeText(rank.ranking, labelToModel)}
                </ReactMarkdown>
              </div>

              {rank.parsed_ranking &&
                rank.parsed_ranking.length > 0 && (
                  <div className="parsed-ranking">
                    <strong>Extracted Ranking:</strong>
                    <ol>
                      {rank.parsed_ranking.map((label, i) => (
                        <li key={i}>
                          {labelToModel && labelToModel[label]
                            ? labelToModel[label].split('/')[1] || labelToModel[label]
                            : label}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="aggregate-rankings">
          <h4>Aggregate Rankings (Street Cred)</h4>
          <p className="stage-description">
            Combined results across all peer evaluations (lower score is better):
          </p>
          <div className="aggregate-list">
            {aggregateRankings.map((agg, index) => (
              <div key={index} className="aggregate-item">
                <span className="rank-position">#{index + 1}</span>
                <span className="rank-model">
                  {agg.model.split('/')[1] || agg.model}
                </span>
                <span className="rank-score">
                  Avg: {agg.average_rank.toFixed(2)}
                </span>
                <span className="rank-count">
                  ({agg.rankings_count} votes)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
