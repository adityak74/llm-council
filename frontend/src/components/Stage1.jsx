import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import './Stage1.css';

export default function Stage1({ responses }) {


  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="stage stage1">
      <h3 className="stage-title">Stage 1: Individual Responses</h3>

      <Tabs defaultValue="0">
        <TabsList>
          {responses.map((resp, index) => (
            <TabsTrigger key={index} value={String(index)}>
              {resp.model.split('/')[1] || resp.model}
            </TabsTrigger>
          ))}
        </TabsList>

        {responses.map((resp, index) => (
          <TabsContent key={index} value={String(index)}>
            <div className="tab-content">
              <div className="model-name">{resp.model}</div>
              <div className="response-text markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{resp.response}</ReactMarkdown>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
