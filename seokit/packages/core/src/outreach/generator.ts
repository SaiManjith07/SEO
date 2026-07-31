import { AIProvider } from '../platform/ai';
import { Opportunity } from './types';
import { ConfigurationProvider } from '../config/provider';

export class OutreachGenerator {
  private aiProvider: AIProvider;
  private configProvider: ConfigurationProvider;

  constructor(aiProvider: AIProvider, configProvider: ConfigurationProvider) {
    this.aiProvider = aiProvider;
    this.configProvider = configProvider;
  }

  public async generateDraft(opportunity: Opportunity): Promise<string> {
    const config = this.configProvider.getSettings().outreach;
    
    let prompt = `You are generating an outreach email on behalf of ${config.brandName}.\n`;
    prompt += `Tone: ${config.outreachPersona}\n\n`;

    if (opportunity.type === 'UNLINKED_MENTION') {
      prompt += `Context: The target URL (${opportunity.url}) mentioned our brand without linking to us.\n`;
      prompt += `Action: Ask them to kindly turn the unlinked mention into a backlink, as it provides better value for their readers.\n`;
    } else if (opportunity.type === 'NARRATIVE_GAP') {
      prompt += `Context: The target URL (${opportunity.url}) mentioned our competitors (${config.targetCompetitors.join(', ')}) but omitted us.\n`;
      prompt += `Action: Suggest adding ${config.brandName} to the list as a viable alternative to ensure their audience gets a complete picture.\n`;
    } else if (opportunity.type === 'BACKLINK_LOST') {
      prompt += `Context: The target URL (${opportunity.url}) recently removed a link pointing to our site.\n`;
      prompt += `Action: Ask if there is a specific reason the link was removed and if we can update the content so they can restore it.\n`;
    }

    if (opportunity.contextSnippet) {
      prompt += `\nSnippet from their page:\n"${opportunity.contextSnippet}"\n`;
    }

    prompt += `\nGenerate ONLY the email subject line and body. No other text.`;

    const draft = await this.aiProvider.generate(prompt);
    return draft;
  }
}
