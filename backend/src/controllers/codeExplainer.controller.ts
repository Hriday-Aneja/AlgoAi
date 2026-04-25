import { Request, Response } from 'express';
import { explainCodeLineByLine } from '../services/codeExplainer.service';
import env from '../config/env';

export const explainCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    // Debug logging
    console.log('📨 Code explanation request received');
    console.log('   Request body:', req.body);
    console.log('   Code length:', code?.length || 0);
    console.log('   Language:', language);

    // Validate input
    if (!code || typeof code !== 'string') {
      console.warn('⚠️  Validation failed: Code is missing or not a string');
      res.status(400).json({
        success: false,
        error: 'Code is required and must be a string'
      });
      return;
    }

    if (!language || typeof language !== 'string') {
      console.warn('⚠️  Validation failed: Language is not a string');
      res.status(400).json({
        success: false,
        error: 'Language is required and must be a string'
      });
      return;
    }

    // Get Groq configuration
    if (!env.GROQ_API_KEY) {
      console.error('❌ Groq API key not configured');
      res.status(500).json({
        success: false,
        error: 'Groq API configuration is missing'
      });
      return;
    }

    console.log('✅ Validation passed. Calling code explanation service...');

    // Call the code explanation service
    const explanation = await explainCodeLineByLine(
      code,
      language,
      env.GROQ_API_KEY,
      env.GROQ_MODEL || 'llama-3.1-8b-instant'
    );

    console.log('✅ Code explanation generated successfully');

    res.status(200).json({
      success: true,
      data: explanation
    });
  } catch (error) {
    console.error('❌ Code explanation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to explain code';
    const statusCode = errorMessage.includes('not configured') ? 500 : 400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};
