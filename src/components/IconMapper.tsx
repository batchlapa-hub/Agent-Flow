import React from 'react';
import {
  Bot,
  Sparkles,
  Filter,
  FileText,
  Mail,
  Code,
  Database,
  Shield,
  CheckCircle,
  Terminal,
  Zap,
  GitBranch,
  Share2,
  Brain,
  Search,
  Cpu,
  Tags,
  Table,
  HelpCircle,
  Globe,
  Sliders,
  Send,
  Play
} from 'lucide-react';

interface IconMapperProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconMapper: React.FC<IconMapperProps> = ({ name, className = "w-4 h-4", size }) => {
  const iconProps = { className, size };

  switch (name.toLowerCase()) {
    case 'bot':
      return <Bot {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'filter':
      return <Filter {...iconProps} />;
    case 'file-text':
    case 'filetext':
      return <FileText {...iconProps} />;
    case 'mail':
      return <Mail {...iconProps} />;
    case 'code':
      return <Code {...iconProps} />;
    case 'database':
      return <Database {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    case 'check-circle':
    case 'checkcircle':
      return <CheckCircle {...iconProps} />;
    case 'terminal':
      return <Terminal {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'git-branch':
    case 'gitbranch':
      return <GitBranch {...iconProps} />;
    case 'share-2':
    case 'share2':
      return <Share2 {...iconProps} />;
    case 'brain':
      return <Brain {...iconProps} />;
    case 'search':
      return <Search {...iconProps} />;
    case 'cpu':
      return <Cpu {...iconProps} />;
    case 'tags':
      return <Tags {...iconProps} />;
    case 'table':
      return <Table {...iconProps} />;
    case 'globe':
      return <Globe {...iconProps} />;
    case 'sliders':
      return <Sliders {...iconProps} />;
    case 'send':
      return <Send {...iconProps} />;
    case 'play':
      return <Play {...iconProps} />;
    default:
      return <Bot {...iconProps} />;
  }
};
